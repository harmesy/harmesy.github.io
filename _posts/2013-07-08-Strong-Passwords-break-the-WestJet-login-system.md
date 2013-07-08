---
layout: post
title: Strong Passwords break the WestJet login system
---

Yesterday I sat down with the intention of booking a flight for an upcoming trip. I had a coupon code from WestJet that would give me 30% of my flight, so naturally I turned to WestJet.ca. 

I have a WestJet account. My account is pretty new, so I don't have a great deal of reward miles on it, but that's ok, I'll build them up slowly. I clicked on the sign in link, filled out the form, and clicked "Sign in", and was presented with this:

![Broken screen]({{site.url}}/images/westjet/broken-screen.png)

"Damn", I thought, "Guess they're having some problems. Oh well, I'm sure it won't take that long, I'll try again in a bit." I left it, intending on trying again later on. A little while later I went back, and tried signing in again. I got the same "technical difficulties" screen. I went to twitter, and checked the @mentions for the @WestJet account, expecting to see people complaining about the issue. But from what I could tell nobody else had sent any public message complaining of the same issue. I sent @WestJet a message that it seemed like there was a problem with their rewards account, and went to bed. In the morning they had replied, asking if I was using an email address to login, since there can be problems when more than one rewards account is tied to the same email address (this is kind of strange, having two different rewards accounts going to the same email address, which incidentally is the case with me, apparently at some point I created two accounts without realizing it, so now I have to login with my 12345678-esque rewards ID instead of my email address). Unfortunately that wasn't the problem, as I wasn't using my email, but my actual rewards ID.

I sent a reply to that effect and left on my morning dog walk. Then something occurred to me. This seemed to be a problem only affecting me, what had I done on that account lately? Well, I had changed my password.

I don't use the account that often, and when I went to login yesterday I couldn't remember what password I had used. A while ago I started using 1Password to manage my accounts/generate passwords, but either I had last used this account before switching to 1Password, or I had neglected to enter it in the 1Password manager, because I had no WestJet entry. So I clicked the reset option, entered my email and my rewards ID, and reset my password. When I got the reset link, I used the password generator in 1Password to generate a long string with random letters, numbers, and special characters. In this instance, it generated a password similar to "zieL49bi4=.kR9M@hP;e". I didn't get any kind of warning on the password reset screen, so I entered the new password, and sent it off to the WestJet servers. Everything seemed to work fine at that point, until I went to login with my new password immediately afterwards.

When I got home from my dog walk I tried resetting my password again, this time entering a simple password consisting of just numbers. After reseting it with this new simple password, the login worked fine. Somehow, in the WestJet.ca application code, some of the special characters in my original password must cause an error to be thrown, breaking the login process.

While writing this, I tried entering another password in the reset screen. For example, a password similar to "4239AA9{Gd:n)Asq1pU2B+G" (note, no equals sign). It reset fine, but this time when I tried to login, instead of throwing me to an error screen it returned to the login page, and said my login was invalid. 

So there are two possible scenarios when using strong logins. One, it actually breaks the application, or two, it looks like the application just isn't able to run a proper comparison when there are special characters.

###Why this upsets me###
First of all. To all application developers out there. Let me use strong passwords. There is no real reason to hamstring me into using some simplistic login.

Secondly, if you're going to force me into conforming to some kind of rule when creating my password, at the very least let me know! Use client and server side validation to let me know that my new password isn't going to work. Post information next to the input box that spells out the rules for me.

![Password reset screen]({{site.url}}/images/westjet/password-reset-screen.png)

I should point out that when you are logged in, and you go to change your password there is a box that can be clicked which will show you the rules.

![Logged in password change]({{site.url}}/images/westjet/logged-in-password-change.png)

This box doesn't exist on the password reset screen, and in any case, it isn't visible by default, AND, it doesn't actually matter, since there is absolutely zero client or server side validation that goes on. I can still use passwords with special characters and successfully change my password. I just can't use it to login later.

![Successful logged in change]({{site.url}}/images/westjet/successful-logged-in-change.png)

Finally, this worries me. Feeding my strong password into a hashing algorithm shouldn't be much of an issue. The application should only really be worried about dealing with the hashed password, and the output of the hashed password should not be based at all on the input, so changing between a password with special characters and a basic password shouldn't have any effect on it. I worry about how the password is treated in the WestJet.ca application. I sincerely hope that the passwords are not stored in plaintext (I should point out that when you use the "forgot password" flow you are not given your password, as I know some other sites, which do store their passwords in plain text do).

As the difference with the password containing an equals sign showed, the password is treated strangely when sent to the server. I do worry if someone smarter and more malicious than myself could exploit the login screen to their benefit. At the very least it seems like the actual error isn't returned to the screen, so I'm not entirely sure how you would go about retrieving any information after an attacker injected malicious code. But then again, I'm no security expert.

The whole process was unduly frustrating, and made me consider switching to Porter or Air Canada for my flight (even though my experience with flying Air Canada in the past has been less than stellar). At the end of the day I figured out the problem and was able to book my flight successfully, but it certainly did in some way damage my opinion of WestJet. I sent their twitter account a message that I had managed to login by removing the special characters from my password, and my displeasure with the need to do so. Hopefully they consider revamping the login portion of their system in the near future.