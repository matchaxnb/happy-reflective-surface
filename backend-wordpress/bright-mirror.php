<?php
/**
 * Plugin Name:     Bright Mirror
 * Plugin URI:      https://www.bluenove.com
 * Description:     Bright Mirror posts by bluenove
 * Author:          Matcha@bluenove
 * Author URI:      https://gitlab.com/ChloeTigre
 * Text Domain:     bright-mirror
 * Domain Path:     /languages
 * Version:         {{version}}
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
define("BRIGHTMIRROR_WEBAPP_VERSION", "meow");
define("BRIGHTMIRROR_DEFAULT_POST_STATUS", "publish");

// URL settings
define("BRIGHTMIRROR_BMTAG_SLUG", "bm-tag");
define("BRIGHTMIRROR_SEGMENT_SLUG", "bms");
define("BRIGHTMIRROR_POST_HOLDING_IMAGES", 1299);
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
    // ignore very small pixels
    if (isset($body['image']) && strlen($body['image']) > 100) {
        $image = datauri_to_bytes($body['image']);
        $res_image = add_image_to_post($res, $image);
    } else {
      // pick a random image 
      $availpics = get_children(
	      [

		      'posts_per_page' => 1,
		      'orderby' => 'rand',
		      'order' => 'ASC',
		      'post_type' => 'attachment',
		      'post_mime_type' => 'image',
		      'post_parent' => BRIGHTMIRROR_POST_HOLDING_IMAGES,
	     ]);
	$pico = array_pop($availpics);
        $pic = $pico->ID;
      	set_post_thumbnail( $res, $pic );

    }
    $editUrl = \rest_url("brightmirror/v1/stories/${res}?extra_id=${randomid}");
    // add segment taxonomy if present (and thus supported in the client)
    // TODO: only accept existing segments here.
    if (isset($body['segment'])) {
        $s = $body['segment'];
        wp_set_post_terms($res, array($s), 'bm_segment', false);
    }
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
            'name' => _x( 'Bright Mirror Tags', 'taxonomy general name', 'bright-mirror' ),
            'singular_name' => _x( 'Bright Mirror Tag', 'taxonomy singular name', 'bright-mirror' ),
            'search_items' =>  __( 'Search Tags', 'bright-mirror' ),
            'popular_items' => __( 'Popular Tags', 'bright-mirror' ),
            'all_items' => __( 'All Tags', 'bright-mirror' ),
            'parent_item' => null,
            'parent_item_colon' => null,
            'edit_item' => __( 'Edit Tag', 'bright-mirror' ),
            'update_item' => __( 'Update Tag', 'bright-mirror' ),
            'add_new_item' => __( 'Add New Tag', 'bright-mirror' ),
            'new_item_name' => __( 'New Tag Name', 'bright-mirror' ),
            'separate_items_with_commas' => __( 'Separate tags with commas', 'bright-mirror' ),
            'add_or_remove_items' => __( 'Add or remove tags', 'bright-mirror' ),
            'choose_from_most_used' => __( 'Choose from the most used tags', 'bright-mirror' ),
            'menu_name' => __( 'Tags', 'bright-mirror' ),
            );

    $labels_segments = array(
            'name' => _x( 'Bright Mirror Segments', 'taxonomy general name', 'bright-mirror' ),
            'singular_name' => _x( 'Bright Mirror Segment', 'taxonomy singular name', 'bright-mirror' ),
            'search_items' =>  __( 'Search Segments', 'bright-mirror' ),
            'popular_items' => __( 'Popular Segments', 'bright-mirror' ),
            'all_items' => __( 'All Segments', 'bright-mirror' ),
            'parent_item' => null,
            'parent_item_colon' => null,
            'edit_item' => __( 'Edit Segment', 'bright-mirror' ),
            'update_item' => __( 'Update Segment', 'bright-mirror' ),
            'add_new_item' => __( 'Add New Segment', 'bright-mirror' ),
            'new_item_name' => __( 'New Segment Name', 'bright-mirror' ),
            'separate_items_with_commas' => __( 'Separate segment tags with commas', 'bright-mirror' ),
            'add_or_remove_items' => __( 'Add or remove segments', 'bright-mirror' ),
            'choose_from_most_used' => __( 'Choose from the most used segments', 'bright-mirror' ),
            'menu_name' => __( 'Segments', 'bright-mirror' ),
            );

    register_taxonomy('bm_tag','bright-mirror',array(
                'hierarchical' => false,
                'labels' => $labels,
                'show_ui' => true,
                'update_count_callback' => '_update_post_term_count',
                'query_var' => true,
                'rewrite' => array( 'slug' => BRIGHTMIRROR_BMTAG_SLUG ),
                ));
    register_taxonomy('bm_segment','bright-mirror',array(
                'hierarchical' => false,
                'labels' => $labels_segments,
                'show_ui' => true,
                'update_count_callback' => '_update_post_term_count',
                'query_var' => true,
                'rewrite' => array( 'slug' => BRIGHTMIRROR_SEGMENT_SLUG ),
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
    add_shortcode('bm_topic', '\BrightMirror\bright_mirror_shortcode');
    add_shortcode('bm_instructions', '\BrightMirror\bright_mirror_shortcode');
    add_shortcode('bm_loginform', '\BrightMirror\bright_mirror_shortcode');
}

$_bright_mirror_data = [
    'topic' => "Please set topic in shortcode bm_topic",
    'instructions' => "Please set instructions in shortcode bm_instructions",
    'login_form' => "Please set login form contents in shortcode bm_loginform",
];


function bright_mirror_shortcode($atts, $content, $shortcode_tag) {
    global $_bright_mirror_data;
    if ($shortcode_tag == 'bm_topic') {
        $_bright_mirror_data['topic'] = do_shortcode($content);
        return;
    } elseif ($shortcode_tag == 'bm_instructions') {
        $_bright_mirror_data['instructions'] = do_shortcode($content);
        return;
    } elseif ($shortcode_tag == 'bm_loginform') {
        $_bright_mirror_data['login_form'] = do_shortcode($content);
        return;
    }
    wp_enqueue_script('brightmirror-webapp-bundle');
    wp_enqueue_style('brightmirror-webapp-style');
    /* supported parameters:
        api.newPostEndpoint
        api.readPostEndpoint
        editorial.topic
        editorial.instructions (or take $content otherwise)
        editorial.brightMirrorIndexPage
        postExtraData.segment
        language
        defaultAuthor
        hideEditor (through anonymous)
     */
    $shortcodeAtts = [
        'apinewpostendpoint' => null,
        'apireadpostendpoint' => null,
        'editorialtopic' => $_bright_mirror_data['topic'],
        'editorialinstructions' => $_bright_mirror_data['instructions'],
        'postextradatasegment' => null,
        'brightmirrorindexpage' => null,
        'language' => 'fr-fr',
        'defaultauthor' => '',
        'anonymous' => 'yes',
        'anonymousloginform' => $_bright_mirror_data['login_form'],
    ];
    $atts = shortcode_atts($shortcodeAtts, $atts);
    $map = [
        'apinewpostendpoint' => ['api', 'newPostEndpoint'],
        'apireadpostendpoint' => ['api', 'readPostEndpoint'],
        'editorialtopic' => ['editorial', 'topic'],
        'brightmirrorindexpage' => ['editorial', 'brightMirrorIndexPage'],
        'editorialinstructions' => ['editorial', 'instructions'],
        'postextradatasegment' => ['postExtraData', 'segment'],
        'language' => ['language'],
        'defaultauthor' => ['defaultAuthor'],
    ];

    $config = [
        'api' => [
            'newPostEndpoint' => '',
            'readPostEndpoint' => 'please set api.readPostEndpoint',
        ],
        'editorial' => [
            'topic' => 'please set editorial.topic',
            'instructions' => do_shortcode($content)
        ],
        'postExtraData' => [
            'segment' => null,
        ],
        'language' => null,
        'defaultAuthor' => null,
    ];
    $warnNotSet = ['apinewpostendpoint', 'postextradatasegment', 'editorialtopic', 'brightmirrorindexpage'];
    foreach ($warnNotSet as $i) {
        if ($atts[$i] === null) {
            $atts['editorialinstructions'] .= "\n-- BM: please set $i -- \n";
        }
    }

    if ($atts['apireadpostendpoint'] === null && $atts['apinewpostendpoint'] !== null) {
        $atts['apireadpostendpoint'] = $atts['apinewpostendpoint'] . '/';
    }
    // fill default author if user is logged in
    if (\is_user_logged_in() && empty($atts['defaultauthor'])) {
        $atts['defaultauthor'] = wp_get_current_user()->user_login;
    }
    // shitty way to fill the config but heh make it better
    foreach ($atts as $item => $v) {
        if (count($map[$item]) == 2) {
            list($a, $b) = $map[$item];
            $config[$a][$b] = $v;
        } elseif (count($map[$item]) == 1) {
            list($a) = $map[$item];
            $config[$a] = $v;
        }
    }
    $anonymous = (!is_user_logged_in() && $atts['anonymous'] !== 'yes');
    $config['hideEditor'] = $anonymous;
    $jse = json_encode($config);
    $toEcho = <<<EOT
        <div data-widget-host="habitat">
        <script type="text/props">
        $jse
        </script>
        </div>
EOT;
    if ($anonymous) {
        $toEcho .= do_shortcode($atts['anonymousloginform']);
    }
    return $toEcho;
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
