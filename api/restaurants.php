<?php
/**
 * Restaurants API
 *
 * GET  /api/restaurants.php?category=XXXX - Get restaurants by category
 * POST /api/restaurants.php              - Add a new restaurant
 */

// CORS headers - use allowlist for non-public API
$allowed_origins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://fbti.example.com'
];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$is_allowed_origin = in_array($origin, $allowed_origins, true);

header('Access-Control-Allow-Origin: ' . ($is_allowed_origin ? $origin : 'null'));
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include config if it exists
$config_path = __DIR__ . '/config.php';
$config = [];
if (file_exists($config_path)) {
    $config = require_once $config_path;
}

/**
 * Valres_idate category format (must be 4 uppercase letters)
 */
function is_valid_category($category) {
    return preg_match('/^[A-Z]{4}$/', $category);
}

/**
 * Get database connection
 */
function get_db_connection($config) {
    if (empty($config) || !isset($config['host'])) {
        return null;
    }

    try {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $config['host'],
            isset($config['port']) ? $config['port'] : 3306,
            isset($config['database']) ? $config['database'] : 'fbti',
            isset($config['charset']) ? $config['charset'] : 'utf8mb4'
        );

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];

        // Add timeout if specified
        if (isset($config['timeout']) && $config['timeout'] > 0) {
            $options[PDO::ATTR_TIMEOUT] = $config['timeout'];
        }

        return new PDO(
            $dsn,
            isset($config['user']) ? $config['user'] : 'root',
            isset($config['password']) ? $config['password'] : '',
            $options
        );
    } catch (PDOException $e) {
        return null;
    }
}

/**
 * Send JSON error response
 */
function error_response($message, $status_code = 400) {
    http_response_code($status_code);
    echo json_encode(['error' => $message]);
    exit;
}

/**
 * Send JSON success response with count and maxPerType
 */
function success_response($data, $count = 0, $max_per_type = 5, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode([
        'ok' => true,
        'data' => $data,
        'count' => $count,
        'maxPerType' => $max_per_type
    ]);
    exit;
}

/**
 * Get client IP address for rate limiting.
 * Only uses REMOTE_ADDR directly - HTTP_X_FORWARDED_FOR and HTTP_CLIENT_IP
 * are not trusted as they can be trivially spoofed.
 */
function get_client_ip() {
    if (isset($_SERVER['REMOTE_ADDR'])) {
        return $_SERVER['REMOTE_ADDR'];
    }
    return '';
}

/**
 * Check IP rate limit (5 submissions per day per IP)
 */
function check_ip_rate_limit($db, $ip) {
    if (!$db || empty($ip)) {
        // If no DB, allow in development mode but log warning
        return true;
    }

    try {
        $stmt = $db->prepare(
            "SELECT COUNT(*) as cnt FROM restaurants
             WHERE ip = :ip
             AND date >= CURDATE()"
        );
        $stmt->execute([':ip' => $ip]);
        $result = $stmt->fetch();

        // Allow up to 5 submissions per day
        return ($result['cnt'] < 5);
    } catch (PDOException $e) {
        // If table doesn't exist, allow
        return true;
    }
}

/**
 * Check category limit (max 5 per category)
 */
function check_category_limit($db, $category) {
    if (!$db || empty($category)) {
        return true;
    }

    try {
        $stmt = $db->prepare(
            "SELECT COUNT(*) as cnt FROM restaurants
             WHERE category = :category AND suspended = 0"
        );
        $stmt->execute([':category' => $category]);
        $result = $stmt->fetch();

        // Allow up to 5 per category
        return ($result['cnt'] < 5);
    } catch (PDOException $e) {
        // If table doesn't exist, allow
        return true;
    }
}

/**
 * Get restaurants by category with count in single query using SQL_CALC_FOUND_ROWS
 */
function get_restaurants_by_category($db, $category) {
    if (!$db) {
        return ['restaurants' => [], 'count' => 0];
    }

    try {
        // Use SQL_CALC_FOUND_ROWS to get count in same query
        $stmt = $db->prepare(
            "SELECT SQL_CALC_FOUND_ROWS res_id, category, name, user, date
             FROM restaurants
             WHERE category = :category AND suspended = 0
             ORDER BY date DESC"
        );
        $stmt->execute([':category' => $category]);
        $restaurants = $stmt->fetchAll();

        // Get total count without LIMIT
        $count_stmt = $db->query("SELECT FOUND_ROWS() as total");
        $count_result = $count_stmt->fetch();
        $count = (int)$count_result['total'];

        return ['restaurants' => $restaurants, 'count' => $count];
    } catch (PDOException $e) {
        return ['restaurants' => [], 'count' => 0];
    }
}

/**
 * Insert a new restaurant
 */
function insert_restaurant($db, $category, $name, $user, $ip) {
    if (!$db) {
        return false;
    }

    try {
        $stmt = $db->prepare(
            "INSERT INTO restaurants (category, name, user, ip, suspended, date)
             VALUES (:category, :name, :user, :ip, 1, NOW())"
        );
        return $stmt->execute([
            ':category' => $category,
            ':name' => $name,
            ':user' => $user,
            ':ip' => $ip
        ]);
    } catch (PDOException $e) {
        return false;
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $category = isset($_GET['category']) ? strtoupper($_GET['category']) : '';

    if (empty($category)) {
        error_response('Category is required');
    }

    if (!is_valid_category($category)) {
        error_response('Invalid category');
    }

    // Get database connection
    $db = get_db_connection($config);

    // Fetch restaurants from database (single query with count)
    $result = get_restaurants_by_category($db, $category);
    $restaurants = $result['restaurants'];
    $count = $result['count'];

    // Apply htmlspecialchars to all output values for XSS prevention
    $safe_restaurants = array_map(function($r) {
        return [
            'res_id' => (int)$r['res_id'],
            'category' => htmlspecialchars($r['category'], ENT_QUOTES, 'UTF-8'),
            'name' => htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8'),
            'by' => htmlspecialchars(isset($r['user']) ? $r['user'] : '', ENT_QUOTES, 'UTF-8'),
            'date' => isset($r['date']) ? date('Y-m-d', strtotime($r['date'])) : ''
        ];
    }, $restaurants);

    success_response($safe_restaurants, $count, 5);

} elseif ($method === 'POST') {
    // Check Content-Type
    $content_type = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    if (stripos($content_type, 'application/json') === false) {
        error_response('Content-Type must be application/json');
    }

    // Read and parse JSON body
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_response('Invalid JSON');
    }

    // Valres_idate required fields
    $category = isset($data['category']) ? strtoupper($data['category']) : '';
    $name = isset($data['name']) ? trim($data['name']) : '';
    $by = isset($data['by']) ? trim($data['by']) : '';

    if (empty($name)) {
        error_response('Name is required');
    }

    if (!is_valid_category($category)) {
        error_response('Invalid category');
    }

    // Store raw values - htmlspecialchars applied only at output time
    $raw_name = $name;
    $raw_by = $by ?: '匿名用户';

    // Get database connection
    $db = get_db_connection($config);

    // Get client IP
    $client_ip = get_client_ip();

    // Check IP rate limit (5 times per day)
    if (!check_ip_rate_limit($db, $client_ip)) {
        error_response('Rate limit exceeded. You can submit up to 5 restaurants per day.', 429);
    }

    // Check category limit (max 5 per category)
    if (!check_category_limit($db, $category)) {
        error_response('Category limit exceeded. Maximum 5 restaurants per category.', 429);
    }

    // Insert restaurant with suspended=1 (pending review)
    $inserted = insert_restaurant($db, $category, $raw_name, $raw_by, $client_ip);

    if ($inserted) {
        // Get the inserted ID
        $insert_res_id = $db->lastInsertId();
        // Escape at output time
        success_response([
            'res_id' => (int)$insert_res_id,
            'category' => htmlspecialchars($category, ENT_QUOTES, 'UTF-8'),
            'name' => htmlspecialchars($raw_name, ENT_QUOTES, 'UTF-8'),
            'by' => htmlspecialchars($raw_by, ENT_QUOTES, 'UTF-8'),
            'suspended' => 1
        ], 0, 5, 201);
    } else {
        error_response('Failed to submit restaurant', 500);
    }

} else {
    error_response('Method not allowed', 405);
}
