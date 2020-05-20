<?php 
	get_header(); 

	$term = get_queried_object();
	echo ebor_page_title( esc_html__('Bright Mirror entries In: ', 'morello' ) . $term->name );	

	get_template_part( 'inc/content-wrapper', 'open' );
    ?>
    <div class="segment-description"><? echo term_description(); ?></div>
    <?php
	get_template_part( 'loop/loop-post', 'grid-3col' );
	get_template_part( 'inc/content-wrapper', 'close' );
	get_footer();
