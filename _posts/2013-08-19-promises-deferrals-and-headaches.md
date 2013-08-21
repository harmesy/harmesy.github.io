---
layout: post
title: Promises, Deferrals, and a headache
---

<p class="lead">The following will be using the jQuery version of promises.</p>

I am in the process of trying to improve my async js coding abilities, and as a part of that process I'm trying to wrap my feeble mind around using promises. One area that had be confused was the use of `then` (or the depreciated `pipe` in older documentation).

The regular example I've seen is this scenario: You are making one ajax call to a resource that basically sets up a subsequent ajax call to another resource. So for example.

{% highlight js %}
var first_call = $.get('/info');
first_call.done(function(data) {
  var second_call = $.post('/data', data);
});
{% endhighlight %}

The problem with the above example, people say, is that you can't use that `second_call` variable. Because it hasn't been created yet, it's only created within the `first_call.done` callback.

This didn't make much sense to me, I mean, why can't I just return the `$.post` deferred object from within the `first_call.done` callback? Like so:

{% highlight js %}
var first_call = $.get('/info');
var second_call = first_call.done(function(data) {
  return $.post('/data', data);
});

second_call.done(function() {
  // do whatever we want to do when our post to /data is successful
});
{% endhighlight %}

Well unfortunately this doesn't work at all. Because `.done` doesn't return what we return from the callback. It returns itself, so that you can do callback chaining, and have multiple `done` callbacks. From the docs:

>Since deferred.done() returns the deferred object, other methods of the deferred object can be chained to this one, including additional .done() methods. When the Deferred is resolved, doneCallbacks are executed using the arguments provided to the resolve or resolveWith method call in the order they were added.
<small>Via <cite title="jQuery API Docs">http://api.jquery.com/deferred.done/</cite></small>

So (I believe) all you'd be doing in the second example is adding another `done` callback for the `.get` call. So `second_call.done` wouldn't be executed when `$.post` succeeded, it would be executed when `$.get` succeeded, because we're still pointing at the `first_call` deferred object.

Since what we really want is promise chaining we use `then` (I still see `pipe` mentioned, but it has been [depreciated](http://api.jquery.com/deferred.pipe/ "jQuery API Docs") as of jQuery 1.8, with `then` being the replacement).

From the jQuery docs:

>These filter functions can return a new value to be passed along to the promise's .done() or .fail() callbacks, or they can return another observable object (Deferred, Promise, etc) which will pass its resolved / rejected status and values to the promise's callbacks.
<small>Via <cite title="jQuery API Docs">http://api.jquery.com/deferred.then/</cite></small>

So now we can return that promise from `$.post` and use it as a chained promise like we wanted to in our original example. Like so:

{% highlight js %}
var first_call = $.get('/info');
var second_call = first_call.then(function(data) {
  return $.post('/data', data);
});

second_call.done(function() {
  // do whatever we want to do when our post to /data is successful
});
{% endhighlight %}

So now, when `$.get` succeeds our callback in `first_call.then` is executed, which makes the `$.post` call, and returns its promise. When that succeeds our `second_call.done` callback is executed. So we have successfully chained our lookups.

I know this all seems very basic, but being new to promises and deferrals and all that fun stuff can be a bit of a mind-warping experience. At times you're essentially writing code that is looking into the future, a concept that I admit sometimes feels difficult to grasp.