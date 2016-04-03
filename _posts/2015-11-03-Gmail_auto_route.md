---
layout: post
title: Quick tip - Using "+" to automatically categorize incoming email with GMail
comments: true
---

If you use GMail or host your email through Google Apps for Business, there's a helpful way that you can automatically categorize incoming mail.

By way of a quick background, an email address is made up of a *local part*, an @ symbol, and the case insensitive *domain part*.

What makes up the *local part* is defined in part by [RFC 5322](https://tools.ietf.org/html/rfc5322). If you don't feel like reading through the RFC [wikipedia](https://en.wikipedia.org/wiki/Email_address#Local_part) does a nice job of summarizing the rules:

- Uppercase and lowercase Latin letters (A–Z, a–z) (ASCII: 65–90, 97–122)
- Digits 0 to 9 (ASCII: 48–57)
- These special characters: # - _ ~ ! $ & ' ( ) * + , ; = : and percentile encoding i.e. %20
- Character . (dot, period, full stop), ASCII 46, provided that it is not the first or last character, and provided also that it does not appear consecutively (e.g. John..Doe@example.com is not allowed).
- Special characters are allowed with restrictions. They are:
- Space and "(),:;<>@[\] (ASCII: 32, 34, 40, 41, 44, 58, 59, 60, 62, 64, 91–93)
- Comments are allowed with parentheses at either end of the local part; e.g. john.smith(comment)@example.com and (comment)john.smith@example.com are both equivalent to john.smith@example.com.
- International characters above U+007F, encoded as UTF-8, are permitted by RFC 6531, though mail systems may restrict which characters to use when assigning local parts.

As you can see a lot more can go into an email address than you may have thought. Comments in particular look like they could be very cool. By using comments you could say enter your email as joe(possibly-spam-site)@example.com. Then, when you later on start receiving emails addressed to joe(possibly-spam-site)@example.com, you know that *possibly-spam-site* has sold your information, and you can easily make a rule to junk all emails addressed to joe(possibly-spam-site)@example.com.

One problem is that unfortunately many email address validators are incomplete or incorrect. As a result many will refuse to allow an address making use of comments.

You will note that the plus ("+") is a valid character to have in an email address, although it isn't commonly used.

Google's mail software takes advantage of this, and uses it to basically recreate the comments functionality.

Everything from the "+" inclusive to the "@" exclusive gets ignored by GMail. So if you send an email to example+spammy_site@gmail.com the message will be delivered to example@gmail.com. It will recognize in the "To" field the ignored section, so you can do the same thing as above and create a rule to junk, or do whatever you want with emails sent to "example+spammy_site@gmail.com".

*As an aside, Google also ignores periods (".") in the local part. So you don't have to worry about remembering if it's joe.blow@gmail.com or joeblow@gmail.com. They both go the same place.*
