<?php
/**
 * TEMPORARY DEBUG FILE
 * Upload this to your WordPress root and visit yoursite.com/debug-stores.php
 * DELETE THIS FILE AFTER DEBUGGING
 */

// Load WordPress
require_once('../../wp-load.php');

echo "<h1>Charlie's Stores Debug</h1>";

// Check if post types are registered
echo "<h2>Registered Post Types:</h2>";
$post_types = get_post_types(array('public' => true), 'names');
if (in_array('charlie_store', $post_types)) {
    echo "<p style='color: green;'>✅ charlie_store post type IS registered</p>";
} else {
    echo "<p style='color: red;'>❌ charlie_store post type NOT registered</p>";
}

echo "<h3>All Public Post Types:</h3>";
foreach ($post_types as $post_type) {
    echo "<li>" . $post_type . "</li>";
}

// Check if classes exist
echo "<h2>Class Existence:</h2>";
echo class_exists('Charlie_Store_Manager') ? "✅ Charlie_Store_Manager" : "❌ Charlie_Store_Manager";
echo "<br>";
echo class_exists('Charlie_REST_API') ? "✅ Charlie_REST_API" : "❌ Charlie_REST_API";
echo "<br>";
echo class_exists('Charlie_Admin') ? "✅ Charlie_Admin" : "❌ Charlie_Admin";
echo "<br>";
echo class_exists('Charlie_WooCommerce_Integration') ? "✅ Charlie_WooCommerce_Integration" : "❌ Charlie_WooCommerce_Integration";

// Check hooks
echo "<h2>Theme Info:</h2>";
echo "<p>Active Theme: " . get_template() . "</p>";
echo "<p>Theme Directory: " . get_template_directory() . "</p>";

// Try to manually register the post type
echo "<h2>Manual Registration Test:</h2>";
if (class_exists('Charlie_Store_Manager')) {
    $store_manager = new Charlie_Store_Manager();
    echo "<p>✅ Store Manager instantiated</p>";
} else {
    echo "<p>❌ Could not instantiate Store Manager</p>";
}

// Check if init hook fired
echo "<h2>WordPress Init Status:</h2>";
echo "<p>Did Init: " . (did_action('init') ? 'Yes' : 'No') . "</p>";
echo "<p>Current Action: " . current_action() . "</p>";
?>