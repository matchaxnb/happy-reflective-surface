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
		'post_title' => \wp_kses_post($body['title']),
		'post_content' => wp_kses_post($body['body']),
		'post_type' => 'bright-mirror',
		'post_status' => 'publish',
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


// declare stuff
\add_action('init', '\BrightMirror\create_posttype');
\add_action('admin_menu', '\BrightMirror\register_admin_menu');
\add_action('admin_init', '\BrightMirror\register_settings');
\add_action('rest_api_init', '\BrightMirror\add_rest_api_handler');
