<?php
namespace BrightMirror;
?>
<div class="wrap">
	    <h2><?php echo esc_html( get_admin_page_title() ); ?></h2>


<form method="post" action="options.php">
<?php
    echo date('YmdHis');
   \settings_fields('brightmirror');
   \do_settings_sections('bright-mirror-admin');
   \submit_button();
?>

</form>

</div><!-- wrap -->
