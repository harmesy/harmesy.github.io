---
layout: post
title: @media queries and CSS3
---

When I was designing this site I knew I wanted to have a sidebar that was basically locked in place. So that the sidebar wouldn't move, while the rest of the content scrolled. This was pretty easy to implement:

{% highlight css %}
#sidebar {
	position: fixed;
}
{% endhighlight %}

Since the sidebar no longer boxed properly I then added a left margin to the main content to push it past the sidebar (on bootstrap, which I am using it's as simple as applying the `col-md-offset-4` class). Now everything looks nice and pretty. The content sits next to the sidebar, the sidebar is locked in place, everything good right?

Here's the problem, if you then open it up on a smaller device, say, an iPhone, all of a sudden the sidebar is sitting on top of the main content. The reason is simple, when the content shrinks down bootstrap, like most other CSS frameworks, start to stack content vertically so that everything will fit on the narrow screen without having to scroll back and forth. So the content is no longer "offset" from the sidebar, and since the sidebar has been positioned with `position: fixed;` the sidebar now flows over the main content.

To fix this we want to have the sidebar act like all other content and stack up above when we shrink down screen size. Enter CSS3 and @media queries. From MDN:

>A media query consists of a media type and at least one expression that limits the style sheets' scope by using media features, such as width, height, and color. Media queries, added in CSS3, let the presentation of content be tailored to a specific range of output devices without having to change the content itself.
>
>[...]
>
>When a media query is true, the corresponding style sheet or style rules are applied, following the normal cascading rules.

So we can create a rule where the sidebar fixation is only done on large screens. Screens that are at least a certain width:

{% highlight css %}
@media (min-width: 992px) {
  .fixed-sidebar {
    margin-top: 100px;
    position: fixed;
  }
}
{% endhighlight %}

Now everything works great! Things stack normally on small screens, and the `.fixed-sidebar` rules are applied with screens wider than 992px.