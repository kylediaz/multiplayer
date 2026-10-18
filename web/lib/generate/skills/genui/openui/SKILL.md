---
name: openui
description: How to write the OpenUI program and which components it may use. Load this when the app is OpenUI.
---

# OpenUI

submit takes this shape.

{
  "title": string,
  "source": "<openui-lang program>"
}

When submit also asks for lang, set it to "openui". When it asks for schema, schema is { "keys": {} }.

The program does not share state and has no form fields. The component library follows.
