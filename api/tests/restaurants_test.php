<?php
/**
 * Restaurant API Tests
 */

require_once __DIR__ . '/../config.example.php';

class RestaurantAPITest {
    private $base_url;
    private $results = [];

    public function __construct($base_url = 'http://localhost:8080/api') {
        $this->base_url = $base_url;
    }

    private function assertEquals($expected, $actual, $message = '') {
        if ($expected === $actual) {
            $this->results[] = ['pass', $message];
            return true;
        } else {
            $this->results[] = ['fail', "$message - Expected: $expected, Got: $actual"];
            return false;
        }
    }

    private function assertArrayHasKeys($keys, $array, $message = '') {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $array)) {
                $this->results[] = ['fail', "$message - Missing key: $key"];
                return false;
            }
        }
        $this->results[] = ['pass', $message];
        return true;
    }

    private function assertValidCategory($category, $message = '') {
        if (preg_match('/^[A-Z]{4}$/', $category)) {
            $this->results[] = ['pass', $message];
            return true;
        } else {
            $this->results[] = ['fail', "$message - Invalid category: $category"];
            return false;
        }
    }

    public function test_config_example_has_timeout() {
        $config = require __DIR__ . '/../config.example.php';
        $this->assertArrayHasKeys(['host', 'port', 'user', 'password', 'database', 'timeout', 'charset'], $config, 'config.example.php has all required keys');
        $this->assertEquals(5, $config['timeout'], 'timeout is 5');
    }

    public function test_config_example_format() {
        $config = require __DIR__ . '/../config.example.php';
        $this->assertEquals('array', gettype($config), 'config.example.php returns array');
    }

    public function run() {
        echo "Running Restaurant API Tests...\n\n";

        $methods = get_class_methods($this);
        foreach ($methods as $method) {
            if (strpos($method, 'test_') === 0) {
                echo "Testing: $method\n";
                $this->$method();
            }
        }

        echo "\n--- Results ---\n";
        $passed = 0;
        $failed = 0;
        foreach ($this->results as $result) {
            list($status, $message) = $result;
            echo "[$status] $message\n";
            if ($status === 'pass') $passed++;
            else $failed++;
        }
        echo "\nTotal: $passed passed, $failed failed\n";

        return $failed === 0;
    }
}

// Run tests if called directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $test = new RestaurantAPITest();
    $success = $test->run();
    exit($success ? 0 : 1);
}