/*! Copyright (c) 2011 by Jonas Mosbech - https://github.com/jmosbech/StickyTableHeaders
    MIT license info: https://github.com/jmosbech/StickyTableHeaders/blob/master/license.txt */

;(function ($, window, undefined) {
	'use strict';

	var pluginName = 'stickyTableHeaders';
	var defaults = {
			fixedOffset: 0
		};

	function Plugin (el, options) {
		// To avoid scope issues, use 'base' instead of 'this'
		// to reference this class from internal events and functions.
		var base = this;
		var height = [];
		var distance = 0;

		// Access to jQuery and DOM versions of element
		base.$el = $(el);
		base.el = el;

		// Cache DOM refs for performance reasons
		base.$window = $(window);
		base.$clonedHeader = $();
		base.$originalHeader = $();

		// Keep track of state
		base.isCloneVisible = false;
		base.leftOffset = null;
		base.topOffset = null;

		base.init = function () {
			base.options = $.extend({}, defaults, options);

			base.$el.each(function () {
				var $this = $(this);

				// remove padding on <table> to fix issue #7
				$this.css('padding', 0);

				$this.wrap('<div class="divTableWithFloatingHeader"></div>');

				base.$originalHeader = $('thead', $this);
				base.$clonedHeader = base.$originalHeader.clone();

				base.$originalHeader.each(function(a,b) {
					height[a] = parseInt($(this).outerHeight(true));
				});

				base.$clonedHeader.each(function(a,b) {
					$(this).addClass('tableFloatingHeader');
					$(this).css({
					'position': 'fixed',
					'top': 0,
					'z-index': 1, // #18: opacity bug
					'margin-top': distance,
					'display': 'none'
					});
					distance += height[a];
				});

				base.$originalHeader.each(function() {
					$(this).addClass('tableFloatingHeaderOriginal');
				});
				base.$originalHeader.each(function(a,b) {
					$(this).after(base.$clonedHeader[a]);
				});

				// enabling support for jquery.tablesorter plugin
				// forward clicks on clone to original
				base.$clonedHeader.each(function(a,b) {
					var $thisone = $(this);
					$('th', this).click(function (e) {
						var index = $('th', $thisone).index(this);
						$('th', base.$originalHeader[a]).eq(index).click();
					});
				});
				$this.bind('sortEnd', base.updateWidth);
				$this.bind('sortEnd', base.updateHeight);
			});

			base.updateWidth();
			base.updateHeight();
			base.toggleHeaders();

			base.$window.scroll(base.toggleHeaders);
			base.$window.resize(base.toggleHeaders);
			base.$window.resize(base.updateWidth);
			base.$window.resize(base.updateHeight)
		};

		base.toggleHeaders = function () {
			base.$el.each(function () {
				var $this = $(this);

				var newTopOffset = isNaN(base.options.fixedOffset) ?
					base.options.fixedOffset.height() : base.options.fixedOffset;

				var offset = $this.offset();
				var scrollTop = base.$window.scrollTop() + newTopOffset;
				var scrollLeft = base.$window.scrollLeft();

				if ((scrollTop > offset.top) && (scrollTop < offset.top + $this.height())) {
					var newLeft = offset.left - scrollLeft;
					if (base.isCloneVisible && (newLeft === base.leftOffset) && (newTopOffset === base.topOffset)) {
						return;
					}				
					base.$clonedHeader.each(function() {
						$(this).css({
						'top': newTopOffset,
						'left': newLeft,
						'display': 'block'
						});
					});
					base.$originalHeader.each(function() {
						$(this).css('visibility', 'hidden');
					});
					base.isCloneVisible = true;
					base.leftOffset = newLeft;
					base.topOffset = newTopOffset;
				}
				else if (base.isCloneVisible) {
					base.$clonedHeader.each(function() {
						$(this).css('display', 'none');
					});
					base.$originalHeader.each(function() {
						$(this).css('visibility', 'visible');
					});
					base.isCloneVisible = false;
				}
			});
		};

		base.updateWidth = function () {
			// Copy cell widths and classes from original header
			base.$clonedHeader.each(function(a,b) {
				$('th', this).each(function (index) {
					var $this = $(this);
					var $origCell = $('th', base.$originalHeader[a]).eq(index);
					$this.className = $origCell.attr('class') || '';
					$this.css('width', $origCell.width());
				});
			});
			// Copy row width from whole table
			base.$clonedHeader.each(function(a,b) {
				$(this).css('width', base.$originalHeader[a].offsetWidth);
			});
		};

		base.updateHeight = function () {
			// Copy cell heigths from original header
			base.$clonedHeader.each(function(a,b) {
				$('th', this).each(function (index) {
					var $this = $(this);
					var $origCell = $('th', base.$originalHeader[a]).eq(index);
					$this.css('height', $origCell.height());
				});
			});
			// Copy row height from whole table
			base.$clonedHeader.each(function(a,b) {
				$(this).css('height', base.$originalHeader[a].offsetHeight);
			});
		};
		// Run initializer
		base.init();
	}

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function ( options ) {
		return this.each(function () {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
			}
		});
	};

})(jQuery, window);
