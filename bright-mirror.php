<?php
/**
 * Plugin Name:     Bright Mirror
 * Plugin URI:      https://www.bluenove.com
 * Description:     Bright Mirror posts by bluenove
 * Author:          Matcha@bluenove
 * Author URI:      https://gitlab.com/ChloeTigre
 * Text Domain:     bright-mirror
 * Domain Path:     /languages
 * Version:         0.1.0
 *
 * @package         Bright_Mirror
 */

/* Notes on security
   Security in this plug-in is terse. It allows to spam the website
   with posts and has no rate-limiting.

   By design I do not implement security mechanisms here and let them
   be added at the reverse proxy level or through some sort of
   authentication.

   WordPress isn't the right place for rate limiting, tracking and blocking
   abusers, cobbling together a pseudo-IDS. Use NAXSI or Cloudflare!

   Minimal CORS is still implemented because I need it.
 */

namespace BrightMirror;
// some cache buster for later
define("BRIGHTMIRROR_WEBAPP_VERSION", "ronron");
define("BRIGHTMIRROR_DEFAULT_POST_STATUS", "draft");

/** Security code **/

// CORSify this
function send_cors_headers($origin) {
    header('Access-Control-Allow-Origin: '.$origin);
    header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
    header('Access-Control-Max-Age: 1000');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

}

function validate_cors_origin($origin) {
    $allowed = get_option('bmallowed_origin', "");
    if ($allowed == "") {
        return true;
    }
    $allowed = explode("\n", $allowed);
    foreach ($allowed as $tok) {
        if (fnmatch($tok, $origin)) {
            send_cors_headers($origin);
            return true;
        }
    }
    return false;
}


/** API handlers **/

// read list of posts
function handle_list_bm_posts($data) {
    @$origin = $_SERVER['HTTP_ORIGIN'];
    if (!validate_cors_origin($origin)) {
        return ['error' => 'not-allowed'];
    }
    $bmPosts = \get_posts([
            'post_type' => 'bright-mirror',
            'numberposts' => 30,
            'post_status' => 'publish',
            'fields' => 'all',
    ]);
    $result = [];
    foreach($bmPosts as $bmPost) {
        $result[] = ["id" => $bmPost->ID, "title" => $bmPost->post_title];
    }
    return $result;
}

// read a specific post
function handle_read_bm_post($data) {
    $id = $data->get_param('id');
    $bmPost = \get_posts([
            'post_type' => 'bright-mirror',
            'include' => [$id],
            'numberposts' => 1,
            'post_status' => 'publish',
            'fields' => 'ids',
    ]);
    if (count($bmPost)!==1) {
        return ['error' => 'not-allowed'];
    }
    $bmPost = $bmPost[0];
    $bm = get_post($bmPost);
    $author_nickname = get_post_meta($bmPost, 'author_nickname', true);
    $post_thumbnail = get_the_post_thumbnail_url($bmPost, array(400, 400));
    return [
        'id' => $bm->post_id,
        'title' => $bm->post_title,
        'body' => $bm->post_content,
        'summary' => $bm->post_excerpt,
        'author' => $author_nickname,
        'image' => $post_thumbnail,
    ];
}

// post a new post to the list
function handle_create_bm_post($data) {
    // very basic api handler.
    @$origin = $_SERVER['HTTP_ORIGIN'];
    if (!validate_cors_origin($origin)) {
        //        return \WP_Error('not_allowed', 'You are not allowed to do that');
        return ['error' => 'not-allowed'];
    }
    $body = $data->get_json_params();
    $user = \get_user_by('login', 'brightmirror');
    // insert the post and set a random int to it for later use
    $randomid = \bin2hex(\random_bytes(12));
    $author = $body['author'] ?: __('Anonymous bright mirror contributor', 'bright-mirror');
    $res = \wp_insert_post([
            'post_author' => $user->ID,
            'post_title' => \wpautop(\wp_kses_post($body['title'])),
            'post_content' => \wpautop(\wp_kses_post($body['body'])),
            'post_type' => 'bright-mirror',
            'post_excerpt' => \wpautop(\wp_kses_post($body['summary'])),
            'post_status' => BRIGHTMIRROR_DEFAULT_POST_STATUS,
            'meta_input' => [
            'extra_id' => $randomid,
            'author_nickname' => $author,
            ],
    ],
    true);
    $res_image = null;
    if (isset($body['image'])) {
        $image = datauri_to_bytes($body['image']);
        $res_image = add_image_to_post($res, $image);
    }
    $editUrl = \rest_url("brightmirror/v1/stories/${res}?extra_id=${randomid}");
    return [
        'post_id' => $res,
        'extra_id' => \hash('sha256', $randomid),
        'edit_url' => $editUrl,
    ];
}

// there is no DELETE from the API. If you want to delete, use the back-office.

/** helpers **/

// add image bits as a featured image for a post
function add_image_to_post($post_id, $imagebits){
    $upload = \wp_upload_bits("illustration_${post_id}.png", null, $imagebits);

    if (!$upload['error'] ) {
        $filename = $upload['file'];
        $wp_filetype = \wp_check_filetype($filename, null);
        $attachment = array(
                'post_mime_type' => $wp_filetype['type'],
                'post_title' => \sanitize_file_name(basename($filename)),
                'post_content' => '',
                'post_status' => 'inherit'
                );

        $attachment_id = wp_insert_attachment($attachment, $filename, $post_id);

        if (!is_wp_error( $attachment_id ) ) {
            require_once(ABSPATH . 'wp-admin/includes/image.php');

            $attachment_data = wp_generate_attachment_metadata( $attachment_id, $filename );
            wp_update_attachment_metadata( $attachment_id, $attachment_data );
            set_post_thumbnail( $post_id, $attachment_id );
        }
        return ['status' => 'ok'];
    }
    return ['status' => 'nok'];

}

// convert a data URI to bytes
function datauri_to_bytes($nib) {
    $dat = str_replace(' ', '+', $nib);
    $dat =  substr($dat,strpos($dat,",")+1);
    $dat = base64_decode($dat);
    return $dat;
}


/** hooks to WordPress **/

// post type bright-mirror
function create_posttype() {
    register_post_type('bright-mirror',
            array(
                'labels' => array(
                    'name' => __('bright-mirror'),
                    'singular_name' => __('Bright Mirror Entry', 'bright-mirror'),
                    ),
                'public' => true,
                'has_archive' => true,
                'rewrite' => array('slug' => 'bright-mirror'),
                'supports' => array( 'title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments' )

                )
            );
    $labels = array(
            'name' => _x( 'Bright Mirror Tags', 'taxonomy general name' ),
            'singular_name' => _x( 'Bright Mirror Tag', 'taxonomy singular name' ),
            'search_items' =>  __( 'Search Tags' ),
            'popular_items' => __( 'Popular Tags' ),
            'all_items' => __( 'All Tags' ),
            'parent_item' => null,
            'parent_item_colon' => null,
            'edit_item' => __( 'Edit Tag' ),
            'update_item' => __( 'Update Tag' ),
            'add_new_item' => __( 'Add New Tag' ),
            'new_item_name' => __( 'New Tag Name' ),
            'separate_items_with_commas' => __( 'Separate tags with commas' ),
            'add_or_remove_items' => __( 'Add or remove tags' ),
            'choose_from_most_used' => __( 'Choose from the most used tags' ),
            'menu_name' => __( 'Tags' ),
            );

    register_taxonomy('bm_tag','bright-mirror',array(
                'hierarchical' => false,
                'labels' => $labels,
                'show_ui' => true,
                'update_count_callback' => '_update_post_term_count',
                'query_var' => true,
                'rewrite' => array( 'slug' => 'bm-tag' ),
                ));

}
// post handling
function add_rest_api_handler() {
    register_rest_route('brightmirror/v1', 'stories',
            [[
            'methods' => 'POST',
            'callback' => '\BrightMirror\handle_create_bm_post'
            ],
            [
            'methods' => 'GET',
            'callback' => '\BrightMirror\handle_list_bm_posts',
            ]]
            );
    register_rest_route('brightmirror/v1', 'stories/(?P<id>\d+)',
            [
            'methods' => 'GET',
            'callback' => '\BrightMirror\handle_read_bm_post',
            ]
            );

}

// settings code (WordPress things)

// admin menu thingies
function register_admin_menu() {
    \add_menu_page(
            __('Bright Mirror', 'bright-mirror'),
            __('Bright Mirror', 'bright-mirror'),
            'administrator',
            'bright-mirror-admin',
            '\BrightMirror\admin_menu',
            'dashicons-format-aside'
            );
    \add_options_page(
            __('Bright Mirror', 'bright-mirror'),
            __('Bright Mirror', 'bright-mirror'),
            'administrator',
            'bright-mirror-admin',
            '\BrightMirror\admin_menu'
            );

}

// options page boilerplate
function admin_menu() {
    require_once dirname(__FILE__).'/partials/bright-mirror-admin-display.php';
}

function register_settings() {
    add_settings_section(
            'brightmirror',
            __('Bright Mirror options', 'bright-mirror'),
            '\BrightMirror\options_content',
            'bright-mirror-admin');
    add_settings_field(
            'bmallowed_origin',
            __('Allowed Cross-Origins', 'bright-mirror'),
            '\BrightMirror\bmallowed_origin_form_content',
            'bright-mirror-admin',
            'brightmirror'
            );
    register_setting('brightmirror', 'bmallowed_origin');

}

function options_content() {
    echo '<p>'.__('Settings for the Bright Mirror plugin', 'bright-mirror').'</p>';
}

function bmallowed_origin_form_content() {
    ?>
        <textarea id="bmallowed_origin" name="bmallowed_origin" style="width: 40em; height: 20em;"><?php echo get_option('bmallowed_origin', ''); ?></textarea>
        <?php
}

function bootstrap() {
    // prevent issues with autop
    remove_filter('the_content', 'wpautop');
    add_filter('the_content', 'wpautop', 12);
    add_filter( 'no_texturize_shortcodes', '\BrightMirror\bm_no_texturize' );
    add_shortcode('bright_mirror', '\BrightMirror\bright_mirror_shortcode');
}

function bright_mirror_shortcode($atts, $content, $shortcode_tag) {
    wp_enqueue_script('brightmirror-webapp-bundle');
    wp_enqueue_style('brightmirror-webapp-style');
    ?>
        <div data-widget-host="habitat">
        <script type="text/props">
        <?php echo $content; ?>
        </script>
        </div>
        <?php
}

function bm_no_texturize( $shortcodes ) {
    $shortcodes[] = 'bright_mirror';
    return $shortcodes;
}

function register_webapp_scripts() {
    wp_register_script('brightmirror-webapp-bundle', plugin_dir_url(__FILE__)."webapp/bundle.js", array(), BRIGHTMIRROR_WEBAPP_VERSION);
    wp_register_style('brightmirror-webapp-style', plugin_dir_url(__FILE__)."webapp/bundle.css", array(), BRIGHTMIRROR_WEBAPP_VERSION);
}

// declare stuff
\add_action('init', '\BrightMirror\bootstrap');
\add_action('init', '\BrightMirror\register_webapp_scripts');
\add_action('init', '\BrightMirror\create_posttype');
\add_action('admin_menu', '\BrightMirror\register_admin_menu');
\add_action('admin_init', '\BrightMirror\register_settings');
\add_action('rest_api_init', '\BrightMirror\add_rest_api_handler');
