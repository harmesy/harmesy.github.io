---
layout: post
title: Careful adding a NOT NULL column to an existing database
comments: true
---

Here's your scenario, you have a table. You want to add a column at some point. Said column is required, and you therefore wish to ensure an appropriate value is always inserted. With Rails you add `validates :column, presence: true`. But you want to be careful, you want to ensure that you enforce domain rules in the database. Say for example the database is accessed via another application as well, you don't want to leave it up to that application to also follow the correct rules.

Being careful, you go to your migration and add that particular rule:
`add_column :example_table, :column, :string, null: false`

Happy about your work you run a quick `rake db:migrate`.

If you're on PostgreSQL (or MySQL to some extent) everything goes fine. If you're running SQLite however, it's another story.

{% highlight bash %}
rake aborted!
StandardError: An error has occurred, this and all later migrations canceled:

SQLite3::SQLException: Cannot add a NOT NULL column with default value NULL: ALTER TABLE "example_table" ADD "column" varchar NOT NULL
{% endhighlight %}

For some reason on SQLite databases you cannot add a column with a NOT NULL constraint to an existing table without setting a default value, even if there's no data in the table.

On PostgreSQL if there's no data in the table the above would run successfully. If there is data, that would all of a sudden be in violation of the constraint, then the migration would fail.

On MySQL if there's no data in the table then things work like PostgreSQL. If there is data however, it would succeed, as MySQL uses a implicit default. To me this is dangerous, as you're quietly adding a value that would likely not be correct, without the developer being alerted to the issue, but I digress.

Unfortunately on SQLite it doesn't matter whether there's pre-existing data or not.

One way around this, is to make your change in two steps. One, add the column, then two, alter the column to make it NOT NULL.

So your above example would become:

{% highlight ruby %}
class AddColumnToExampleTable < ActiveRecord::Migration
  def change
    add_column :example_table, :column, :string
    change_column_null :example_table, :column, false
  end
end
{% endhighlight %}

Now you know the migration will work and accomplish what you want, whether on PostgreSQL, MySQL, or SQLite (provided there's no pre-existing data that would violate the constraint).
