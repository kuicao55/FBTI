<?php
/**
 * TDD Tests for Restaurants API
 *
 * Prerequisites:
 * - Run 'php -S localhost:8888' in the project root first
 * - Then run: php tests/test_api.php
 *
 * Tests API behavior WITHOUT implementation present (RED phase).
 */

define('API_BASE', 'http://localhost:8888/api');

/**
 * Make GET request to API using curl
 */
function api_get($path, $category = null) {
    $url = API_BASE . '/' . ltrim($path, '/');
    if ($category !== null) {
        $url .= '?category=' . urlencode($category);
    }

    $cmd = 'curl -s -w "\nHTTP_CODE:' . '%{http_code}' . '" ' . escapeshellarg($url) . ' 2>&1';
    exec($cmd, $lines);
    $full_output = implode("\n", $lines);

    // Extract HTTP code
    $http_code = 0;
    if (preg_match('/HTTP_CODE:(\d+)/', $full_output, $matches)) {
        $http_code = (int)$matches[1];
        $full_output = preg_replace('/HTTP_CODE:\d+$/', '', $full_output);
    }

    return [
        'body' => trim($full_output),
        'http_code' => $http_code
    ];
}

/**
 * Make POST request to API using curl
 */
function api_post($path, $data, $content_type = 'application/json') {
    $url = API_BASE . '/' . ltrim($path, '/');
    $body = is_array($data) ? json_encode($data) : $data;

    // Write body to temp file to handle complex JSON
    $tmp_file = tempnam('/tmp', 'api_test_');
    file_put_contents($tmp_file, $body);

    $cmd = 'curl -s -w "\nHTTP_CODE:' . '%{http_code}' . '" -X POST ' .
        '-H ' . escapeshellarg('Content-Type: ' . $content_type) . ' ' .
        '--data-binary @' . escapeshellarg($tmp_file) . ' ' .
        escapeshellarg($url) . ' 2>&1';
    exec($cmd, $lines);
    $full_output = implode("\n", $lines);

    // Extract HTTP code
    $http_code = 0;
    if (preg_match('/HTTP_CODE:(\d+)/', $full_output, $matches)) {
        $http_code = (int)$matches[1];
        $full_output = preg_replace('/HTTP_CODE:\d+$/', '', $full_output);
    }

    @unlink($tmp_file);

    return [
        'body' => trim($full_output),
        'http_code' => $http_code
    ];
}

/**
 * Assert helper
 */
function assert_response($test_name, $condition, $expected, $actual) {
    if ($condition) {
        echo "  PASS: $test_name\n";
        return true;
    } else {
        echo "  FAIL: $test_name\n";
        echo "    Expected: $expected\n";
        echo "    Actual: $actual\n";
        global $failures;
        $failures++;
        return false;
    }
}

// Track test results
$failures = 0;
$tests_run = 0;

// Verify server is running
$test_response = api_get('restaurants.php');
if ($test_response['http_code'] === 0) {
    echo "ERROR: PHP server not running on localhost:8888\n";
    echo "Please start it with: php -S localhost:8888\n";
    exit(1);
}

echo "Server is running. HTTP " . $test_response['http_code'] . "\n";
echo "\n=== Running API Tests ===\n\n";

// Test 1: GET with invalid category (not 4 uppercase letters) -> returns error JSON
echo "Test 1: GET with invalid category (not 4 uppercase letters)\n";
$tests_run++;
$response = api_get('restaurants.php', 'abc'); // Only 3 chars, not 4 uppercase
$result = json_decode($response['body'], true);
$has_error = isset($result['error']) && $result['error'] === 'Invalid category';
assert_response(
    'Invalid category returns error',
    $has_error,
    'error field with "Invalid category"',
    json_encode($result ?? ['raw' => $response['body']])
);

// Test 2: GET with valid category -> returns JSON with ok field
echo "\nTest 2: GET with valid category (4 uppercase letters)\n";
$tests_run++;
$response = api_get('restaurants.php', 'ITAL'); // Valid: 4 uppercase letters
$result = json_decode($response['body'], true);
$has_ok_field = isset($result['ok']) || isset($result['data']) || isset($result['restaurants']);
assert_response(
    'Valid category returns ok/data/restaurants field',
    $response['http_code'] === 200 && $has_ok_field,
    'ok/data/restaurants field present',
    json_encode($result ?? ['raw' => $response['body']]) . " (HTTP " . $response['http_code'] . ")"
);

// Test 3: POST with wrong Content-Type -> returns error JSON
echo "\nTest 3: POST with wrong Content-Type\n";
$tests_run++;
$response = api_post('restaurants.php', json_encode(['category' => 'ITAL', 'name' => 'Test']), 'text/plain');
$result = json_decode($response['body'], true);
$has_content_type_error = isset($result['error']) && (
    strpos($result['error'], 'Content-Type') !== false ||
    strpos($result['error'], 'Content-type') !== false ||
    strpos($result['error'], 'content-type') !== false
);
assert_response(
    'Wrong Content-Type returns error',
    $has_content_type_error,
    'error about Content-Type',
    json_encode($result ?? ['raw' => $response['body']])
);

// Test 4: POST with invalid JSON body -> returns error JSON
echo "\nTest 4: POST with invalid JSON body\n";
$tests_run++;
$response = api_post('restaurants.php', '{invalid json}', 'application/json');
$result = json_decode($response['body'], true);
$has_json_error = isset($result['error']) && (
    strpos($result['error'], 'JSON') !== false ||
    strpos($result['error'], 'json') !== false
);
assert_response(
    'Invalid JSON returns error',
    $has_json_error,
    'error about JSON',
    json_encode($result ?? ['raw' => $response['body']])
);

// Test 5: POST with invalid category -> returns error JSON
echo "\nTest 5: POST with invalid category\n";
$tests_run++;
$response = api_post('restaurants.php', json_encode(['category' => 'abc', 'name' => 'Test Restaurant']), 'application/json');
$result = json_decode($response['body'], true);
$has_invalid_cat_error = isset($result['error']) && $result['error'] === 'Invalid category';
assert_response(
    'Invalid category returns error',
    $has_invalid_cat_error,
    'error field with "Invalid category"',
    json_encode($result ?? ['raw' => $response['body']])
);

// Test 6: POST with valid data but no DB -> returns error JSON (DB not available is OK)
echo "\nTest 6: POST with valid data but no DB\n";
$tests_run++;
$response = api_post('restaurants.php', json_encode([
    'category' => 'ITAL',
    'name' => 'Test Restaurant',
    'description' => 'A test',
    'price_range' => '$$'
]), 'application/json');
$result = json_decode($response['body'], true);
// Should either succeed (if DB exists) or return error about DB not being available
$valid_outcome = isset($result['ok']) || isset($result['error']);
assert_response(
    'Valid POST either succeeds or returns DB error',
    $valid_outcome,
    'ok or error field present',
    json_encode($result ?? ['raw' => $response['body']])
);

// Summary
echo "\n=== Test Summary ===\n";
echo "Tests run: $tests_run\n";
echo "Failures: $failures\n";

exit($failures > 0 ? 1 : 0);
