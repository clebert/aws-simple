# aws-simple

![][ci-badge]

Nothing to see here, yet.

## Motivation

In my job I mainly build frontend web applications for existing backend/CMS
systems. AWS is often used as a cloud platform. Since many of the tech stacks
are similar again and again, I have created an abstraction for the AWS CDK/SDK.
This allows you to easily create an API Gateway with a custom domain and
optional alias record, make static files available via S3 and e.g. provision a
BFF (Backend for Frontend) via Lambda.

Since existing backend/CMS systems are used, there is rarely a need for own
persistence layers. Therefore, setting these up is not part of this abstraction
for the time being.

I deliberately kept it simple. A project with a more complex setup should be set
up manually with the AWS CDK/SDK.

---

Copyright (c) 2019, Clemens Akens. Released under the terms of the [MIT
License][license].

[ci-badge]: https://github.com/clebert/aws-simple/workflows/CI/badge.svg
[license]: https://github.com/clebert/aws-simple/blob/master/LICENSE
