---
layout: post
title: Rails DELETE and data-confirm
---

Rails is very public in embracing REST-style architecture as a default. Different HTTP verbs can result in different methods being triggered in your controller. In our example today we have a `purchase` with an `id` of `2`.

`/purchases/2` will then behave very differently based on the HTTP request.
`GET /purchases/2` will trigger the `show` action, and display the purchase itself.
`PATCH /purchases/2` will trigger the `update` action, which is called after submitting a form from the `purchases/2/edit` page (you actually can't generate an HTTP PATCH request from a form because W3C standards say you can only use `action=post` or `action=get` from an HTML form, but Rails fakes it via `name="_method"`, `value="patch"` hidden form fields).
`DELETE /purchases/2` will trigger the `destroy` action, and remove the record.

When you scaffold out the purchase, a nice listing page gets generated. From the `/purchases` page you can view, edit, and delete purchases.
When you click on `delete` you get a nice little dropdown confirming your choice.
![Delete confirmation](/images/delete-confirm.png)

You can click OK to confirm and delete, or Cancel to halt.

The question is, how does this get generated?
<!-- more -->
If you take a look at the generated source code you'll see something interesting.
![data-confirm HTML](/images/data-confirm-html.png)

You can see this is a simple HTML anchor tag. Inside we have an `href` attribute with the expected `/purchases/2`, the item we're dealing with. We also have a `rel=nofollow` attribute, which is supposed to signal to search engine crawlers not to follow the link ([although many do in fact follow the link, but use the `nofollow` attribute to determine whether it should index the linked page, or use it in calculating the page rank etc.](https://en.wikipedia.org/wiki/Nofollow)).

We also have two `data-*` methods. `data-confirm="Are you sure"` and `data-method="delete"`.

Rails uses these two attributes to attach event handlers to the elements that together will prompt the user to make sure the click wasn't accidental, and build a form that can be POSTed to the server (with an appropriate field marking it as a DELETE request) to actually delete the record.

It does so by using [`jquery-ujs`](https://github.com/rails/jquery-ujs).

`jquery-ujs` is a sort of extension to the jQuery framework that the Rails developers have created to add some specific [unobtrusive javascript](https://en.wikipedia.org/wiki/Unobtrusive_JavaScript) functionality to Rails apps.

It's loaded by default in the `application.js` manifest file in each Rails app.

{% highlight javascript %}
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require_tree .
{% endhighlight %}

Lets take a look at the javascript file that's loaded.

{% highlight javascript %}
$.rails = rails = {
   // Link elements bound by jquery-ujs
   linkClickSelector: 'a[data-confirm], a[data-method], a[data-remote], a[data-disable-with], a[data-disable]',
 {% endhighlight %}

 Hey that has our `data-confirm` and `data-method` attributes. So what is done with `rails.linkClickSelector`? Well, a little further down you'll find the following:
 {% highlight javascript %}
 $document.delegate(rails.linkClickSelector, 'click.rails', function(e) {
  var link = $(this), method = link.data('method'), data = link.data('params'), metaClick = e.metaKey || e.ctrlKey;
  if (!rails.allowAction(link)) return rails.stopEverything(e);

  if (!metaClick && link.is(rails.linkDisableSelector)) rails.disableElement(link);

  if (link.data('remote') !== undefined) {
    if (metaClick && (!method || method === 'GET') && !data) { return true; }

    var handleRemote = rails.handleRemote(link);
    // response from rails.handleRemote() will either be false or a deferred object promise.
    if (handleRemote === false) {
      rails.enableElement(link);
    } else {
      handleRemote.fail( function() { rails.enableElement(link); } );
    }
    return false;

  } else if (method) {
    rails.handleMethod(link);
    return false;
  }
});
{% endhighlight %}

This uses the [jQuery `delegate` method](http://api.jquery.com/delegate/). As you can see by the docs our first argument is the "selector". Basically, we're going to attach an event listener to all elements that match the selector. `rails.linkClickSelector` is a string of a number of different attributes, all of which will be matched. EventType is going to be `click.rails`. What this means is that we're going to capture all `click` events, and it's simply going to be namespaced with `rails`. It's still a regular click event, everything after the `.` doesn't effect the actual event at all, but this way user code can differentiate between say, `click.rails` and `click.whateverelse`. This way you could unbind `click.rails` without affecting other click handlers from other libraries or code. It's a way of being a nice neighbor.

Finally, the handler is passed in as an anonymous function.

In the handler, first the function saves the current context (`var link = $(this)`) and gathers up info such as `method`. We get the value of `data-method` with the call `link.data("method")`, which in this case returns "delete".
Then the function checks to see if this action is "allowed". It does this by calling `rails.allowAction(link)`.

`rails.allowAction` looks like this:
{% highlight javascript %}
allowAction: function(element) {
    var message = element.data('confirm'),
    answer = false, callback;
    if (!message) {
        return true;
    }

    if (rails.fire(element, 'confirm')) {
        answer = rails.confirm(message);
        callback = rails.fire(element, 'confirm:complete', [answer]);
    }
    return answer && callback;
},
{% endhighlight %}

In `allowAction` the function pulls the message to be displayed from our `data-confirm` attribute via `element.data('confirm')`. If `data-confirm` hasn't been provided the assumption is that the action is allowed, so `true` is immediately returned.

A `confirm` event is fired on the element, so you could intercept and cancel the confirmation should you wish to do so.

That doesn't happen here, so the function calls the `rails.confirm` method. `rails.confirm` simply accepts our message and passes it to the `window.confirm` function. This way you can go with a different route by overriding `rails.confirm`.

`allowAction` completes, and we head back into our anonymous function. This isn't a remote call, so we deal with it via `handleMethod`.

{% highlight javascript %}
handleMethod: function(link) {
  var href = rails.href(link),
  method = link.data('method'),
  target = link.attr('target'),
  csrfToken = $('meta[name=csrf-token]').attr('content'),
  csrfParam = $('meta[name=csrf-param]').attr('content'),
  form = $('<form method="post" action="' + href + '"></form>'),
  metadataInput = '<input name="_method" value="' + method + '" type="hidden" />';

  if (csrfParam !== undefined && csrfToken !== undefined && !rails.isCrossDomain(href)) {
      metadataInput += '<input name="' + csrfParam + '" value="' + csrfToken + '" type="hidden" />';
  }

  if (target) {
      form.attr('target', target);
  }

  form.hide().append(metadataInput).appendTo('body');
  form.submit();
},
{% endhighlight %}

This is where the actual deletion request occurs.
{% highlight javascript %}
var href = rails.href(link)
{% endhighlight %}
Get the `href` of our link. (`/purchases/2`)

{% highlight javascript %}
method = link.data('method'),
{% endhighlight %}
Get the `data-method` value. (`delete`)

{% highlight javascript %}
target = link.attr('target'),
{% endhighlight %}
Get the target value. (`undefined`)

{% highlight javascript %}
csrfToken = $('meta[name=csrf-token]').attr('content'),
{% endhighlight %}
Get the csrfToken. (`P3xrSIgzyuqse...`)

{% highlight javascript %}
csrfParam = $('meta[name=csrf-param]').attr('content'),
{% endhighlight %}
Get the csrfParam. (`authenticity_token`)

{% highlight javascript %}
form = $('<form method="post" action="' + href + '"></form>'),
metadataInput = '<input name="_method" value="' + method + '" type="hidden" />';

if (csrfParam !== undefined && csrfToken !== undefined && !rails.isCrossDomain(href)) {
    metadataInput += '<input name="' + csrfParam + '" value="' + csrfToken + '" type="hidden" />';
}

if (target) {
    form.attr('target', target);
}
{% endhighlight %}
Build the form. Plug in the action, the _method, and the CSRF stuff and target if necessary.
Notice we're not actually putting anything substantive into the form. The simple reason is the request to a particular endpoint (`/purchases/2`) with a particular varb (`delete`) achives our result. We don't need other values in the form.

Now we just submit the form in the background:

{% highlight javascript %}
form.hide().append(metadataInput).appendTo('body');
    form.submit();
{% endhighlight %}

And we're done.
