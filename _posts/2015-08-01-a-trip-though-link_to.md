---
layout: post
title: A Trip Through "link_to"
comments: true
---

Rails is a fantastic framework in so many ways. One of its "drawbacks" (and one shared but basically all other frameworks of any complexity) is the amount of "automagic" work that goes on behind the scenes. I put drawbacks in quotes because certainly hiding complexity is one of the whole points to a framework. But if you're like me, you like to understand _why_ that particular line of code worked, and what the framework is doing inside the black box.

In an effort to drill down into some of the everyday methods we use I've decided to start selecting pieces of commonly used Rails code, and following the entire chain through from call to return.

To do so I've setup a developer copy of rails with `Vagrant`. I'll be using the `byebug` gem to step through line by line, documenting what code we hit on the way.

The first method we're going to follow is ["link_to"](http://api.rubyonrails.org/classes/ActionView/Helpers/UrlHelper.html#method-i-link_to).

`Link_to` is of course a method used with great regularity to generate an html href link, with the added benefit of harnessing the power of `routes.rb`, as a means of future proofing against changes to url naming etc. As you can see from the docs you can throw various inputs to the method. You can provide a hash with the controller, action, and id. You can also link with the `*_path` and `*_url` methods, such as `products_path` and `product_path(@product)`. You can also simply provide the object you want to link to itself, such as `link_to @product.name, @product`.

The question is, how does this simple method handle all of this? How does it take such different inputs and produce an appropriate href link in accordance with the rules found in `routes.rb`?
<!-- more -->
First, we start with the method definition found at `actionview/lib/action_view/helpers/url_helper.rb`.
![link_to source](/images/link_to-screenshot.png)
Note: The `byebug` line is not normally found in the rails source. I inserted the line as a starting point for our step-by-step walkthrough of the method chain.

In this example we're going to run through with `link_to` being invoked as `link_to @product.name, @product`.

We enter `link_to` and immediately start doing some weird playing around with the parameters. You can see that if a block is provided to the method `html_options` is set to the value of `options`, `options` is set to the value of `name`, and `name` is set to the content of the block.

This sort of shuffling is done to accomodate a specific use case. As you can see in the docs, when you provide a block to the method the ordering of the parameters is going to change.
![link_to block example](/images/link_to-block-example.png)
As you can see in the above example, the first paramter to `link_to` in this case is actually the object `@profile`. This would be the `options` parameter when called without the block (as it is in our example). Since the `name` is actually going to come from the block the ordering for the parameters is all messed up.

This shuffling could be addressed with [keyword arguments](https://robots.thoughtbot.com/ruby-2-keyword-arguments). Why aren't keyword arguments used in Rails? Well, at the time of this post the most current stable Rails release is `4.2.3`. It requires [at least Ruby 1.9.3](https://rubygems.org/gems/rails/versions/4.2.3). Since keyword arguments only became available in Ruby at version 2.0 the Rails devs couldn't introduce keyword arguments without bumping the required Ruby version to at least 2.0. The next big Rails release will be 5.0, which the developers have indicated will require Ruby 2.2+, and they [will be converting to keyword arguments](http://weblog.rubyonrails.org/2014/12/19/Rails-4-2-final/).

Now that we've sorted out any issues with parameter ordering, it's time to process the options passed in.
![convert_options_to_data_attributes source](/images/convert_options_to_data_attributes.png)
You'll notice that this method does check both the `html_options` and `options` parameters for the `'remote'` or `:remote` option. I can only speculate that this is simply done as it may be unclear to developers whether the remote option should be set as an option for the url, or an html option for the tag.

_As an aside, this is also why you need to be careful if using the old style of specifying controller, action, and parameter in a hash, while also passing in html options. You need to be sure to add the `{ }` brackets to explicitly split up `options` and `html_options`. If you're providing an object (such as `@product`) or a method call (such as `products_path`) to `options`, everything works fine. If however you're using the older style, and specifying `controller: "products", action: "show", id: @product`, you run into what I would describe as a "greedy hash". This behavior can be seen in the `irb` session below:
![greedy hash example](/images/greedy-parameters.png)
As you can see, with us passing in a hash to the second parameter, the hash "sucks up" all the parameters we pass it. This could be remedied by being explicit with your `{ }` brackets._

We're back into `link_to` now. You would probably expect that the `url = url_for(options)` call would pass the execution to the `url_for` method in the same module. You would however be incorrect. This is because of the fun that is Ruby, more specifically, some of the metaprogramming that it allows. We turn to the `turbogears` gem, which is required into Rails. The `/var/lib/gems/2.2.0/gems/turbolinks-2.5.3/lib/turbolinks.rb` file contains the following code:
![turbolinks prepend](/images/turbolinks-prepend.png)
This plays with the Ruby inheritance chain, and the `XHRUrlFor` module actually gets inserted before the calling object in the chain.

If we look at the `XHRUrlFor` module (located at `/var/lib/gems/2.2.0/gems/turbolinks-2.5.3/lib/turbolinks/xhr_url_for.rb` on my system) we find the following:
![XHRUrlFor](/images/XHRUrlFor.png)
The line `base.alias_method_chain :url_for, :xhr_referer` aliases `url_for` to `url_for_with_xhr_referer` (see [the docs](https://github.com/rails/rails/blob/master/activesupport/lib/active_support/core_ext/module/aliasing.rb) to see how it works and [a good explanation on StackOverFlow for why the method exists](http://stackoverflow.com/questions/3695839/ruby-on-rails-alias-method-chain-what-exactly-does-it-do#answer-3697391)).
As a result, when we call `url_for` we actually end up in `Turbolinks::XHRUrlFor#url_for_with_xhr_referer`.

`url_for_with_xhr_referer` does its thing, then calls `url_for_without_xhr_referrer`, which, if you read the doc linked above, you know is the original `url_for` method.

So now we move on to `ActionView::RoutingUrlFor#url_for`.

If you take a look at [the source](https://github.com/rails/rails/blob/master/actionview/lib/action_view/routing_url_for.rb) you'll see a switch statement dealing with `options`. In this case we've called `link_to` passing our object in directly, so none of the `when` statements are triggered. We end up down in the `else` statement.

First we figure out if we're building a *_path or *_url, then it's off into another switch.
![Route builder](/images/routebuilder.png)

Again, we're passing in our @product item itself, so nothing matches and we end up in `else`.
![Route debugger](/images/route_debug.png)

`ActionDispatch::Routing::PolymorphicRoutes::HelperMethodBuilder#handle_model_call` can be found at `/rails/actionpack/lib/action_dispatch/routing/polymorphic_routes.rb`.
`model` is our @product object. `target` is our response object.

In `handle_model` the `#to_model` call is made in case our object isn't _really_ like an ActiveRecord model, to give us an opportunity to return a wrapper object that provides the necessary methods to make the whole thing work. As our object is a regular ActiveRecord object `self` is returned and we don't have to worry about anything.

Back in `handle_model` now. This is where the meat of the url construction happens.
First the method checks whether our object has been persisted. Basically whether it has been saved in the db yet.

Next we get the url lookup method for our particular object. It does this by looking up the model name. `#model_name` gives us an object with a bunch of useful attributes, such as `singular`, `plural`, and `human`. We now look up the `singular_route_key`, since it's a persisted singular object.

Here we go, `get_method_for_string`:

{% highlight ruby %}
def get_method_for_string(str)
    "#{prefix}#{str}_#{suffix}"
end
{% endhighlight %}

There we go. We finally have our `product_path`.

Now back in `handle_model_call`, `send` is used to call `product_path` with our @product passed as an argument on our response object.

More metaprogramming fun is accomplished to define our `product_path` method. Specifically in `define_url_helper` in `/rails/actionpack/lib/action_dispatch/routing/route_set.rb`.
![define_url_helper](/images/define_url_helper.png)

`helper.call` throws us into `ActionDispatch::Routing::RouteSet::NamedRouteCollection::UrlHelper::OptimizedUrlHelper#call`

Honestly? At this point I start to get a little lost in the weeds.

`t.url_options` returns a hash that looks like this:
    {:host=>"localhost", :port=>3000, :protocol=>"http://", :_recall=>{:controller=>"products", :action=>"index"}, :script_name=>""}

`@options` likewise returns a hash that looks like this:
    {:controller=>"products", :action=>"show"}

`optimized_helper` calls `parameterize_args` on our @product, which in turn calls `to_param`. Since we haven't overriden `to_param` it looks for the value of `id`.

`ActiveRecord::AttributeMethods::Read` and `_read_attribute` is used to look up the value of `ID`.
Various typecasting occurs here as Rails pulls the value out of the db and figures out what it should do with it and how it should be treated. But I'm glossing over that for today.

So we walk out of `parameterize_args` with `{ id: 1 }`, which gets passed to `ActionDispatch::Journey::Route#format`.
`ActionDispatch::Journey::Format#evaluate` actually does most of the work, of constructing each part of our path. We end up with `["/", "products", "/", "1", ""]`

Trailing slashes, url parameters, and anchors are then added afterwards in `ActionDispatch::Http::URL#path_for` if necessary (which it isn't in our case).

Finally back out at our original `link_to` method. We add the url that we've generated through all those steps to the `html_options` hash, then we generate the actual anchor tag with `content_tag`.

And we're done!

All that to generate `<a href="/products/1">Show</a>`. Exciting stuff.

The point of all of this is to show the surprising amount of complexity that goes into such a simple call such as `link_to`. There's a lot of logic and design that is constructed to allow the developer to throw a variety of input, and always get back an appropriate and up to date link. Behind the scenes things like "is this an ajax request?" are addressed, the ability to define different ways to refer to your objects (/user/username instead of /user/1) are provided, html options and url parameters are constructed. Basically, if you wanted to you could do a lot with a link, and `link_to` has to do a lot of things to make sure it covers every use case.
