# haslo 🤖 📟 🦖

> *hasło* means *password* in Polish. 🇵🇱

A console-native inquirer.js-based UI for [pass (.password-store)](https://www.passwordstore.org/) with case-insensitive autocomplete for entries search.

Whoa!

```
$ haslo
? Find:  socia
❯ social/Facebook/XXXXXXXXXXXXXXX
  social/Google/XXXXXXXXXXXXXXX
  social/Linkedin/XXXXXXXXXX
(Move up and down to reveal more choices)
```

```
? Action on social/Facebook/XXXXXXXXXXXXXXX (Use arrow keys)
❯ Copy password 
  Copy user 
  Copy URL 
  Show 
  Go back 
```

## Features 🐙

- console-native

- case-insensitive autocomplete

- copy and show actions

- just uses `pass` under-the-hood

## Security 🛡️

It doesn't try to read your GPG-encrypted passwords, but leaves that job to `pass` instead. Uses glob to search through store's directories, with inquirer.js's powerful case-insensitive autocomplete. Calls `pass` binary afterwards with proper parameters to act on the entry.
