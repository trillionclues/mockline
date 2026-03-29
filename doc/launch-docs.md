## Twitter/X — @getmockline
Mockline is live 🚀

Upload an OpenAPI spec. Get an isolated mock API server. Instantly.

Built for dev teams tired of waiting on backend dependencies.

Free to start → mockline.xyz


## LinkedIn — Personal
I just launched Mockline.

The idea came from a problem I kept running into — frontend and QA teams blocked because the backend API wasn't ready. Every team often faces this bottleneck.

So I built a tool for it. You upload your OpenAPI spec and get a fully isolated mock API server running in seconds. No extra configurations, no Docker setup, no extra logic.

Here's what it does:
• Parses any OpenAPI 3.x spec (YAML or JSON)  
• Spins up a real container with mock responses  
• Gives you a live URL to test against & share with your team immediately  
• Contract testing to verify your real API matches the spec  

It's live today and free to start: https://mockline.xyz

If you work in engineering, QA, or product — I'd genuinely appreciate you trying it and telling me what breaks or what's missing.

#developer #api #openapi #devtools #startup


## Product Hunt
Name of launch: Mockline
Product Tagline: Spin Up Live Mock API From Openapi Specs

Links to launch:
https://mockline.xyz
https://github.com/trillionclues/mockline

Is this an open source project? Yes

Description
What’s new or different about your launch compared to existing products? Which features make it stand out? 
Mockline is an open-source PaaS that provisions isolated, Docker-powered mock API servers from OpenAPI specifications. Upload a spec, get a live URL in seconds.

Launch tags: api, openapi, devtools, startup

Write the first comment: 
Hi PH, I built Mockline, a tool that provisions isolated, Docker-powered mock API servers from OpenAPI specifications.

The problem:
I primarily worked as a FE dev so every sprint I'd start building against an API that didn't exist yet. The options were bad: I either remain blocked until the backend shipped, build against hardcoded JSON that drifts the moment something changes, or maintain a local mock nobody else was using.

The frustrating part — the spec usually exists, you just can't run it. I believe QAs hit the same challenge with writing integration tests against an endpoint that isn't live. And the longer this goes, the more testing gets compressed into the last 48 hours of a sprint.

What Mockline does:
Upload(build im-app) an OpenAPI 3.0 spec (YAML/JSON or remote URL). Mockline builds a Docker image with the Contour CLI for data generation baked in, spins up a container, and assigns a public URL — live mock server with real HTTP responses in 3-7 seconds.

Also each mock is isolated per spec version. You can run contract tests to validate the mock matches the spec, and diff two versions to catch breaking changes before production.

What's shipped right now:
> Spec upload and versioning
> Mock server provisioning public URLs
> Start/stop/delete controls
> Contract testing and schema diffing > In-dashboard API client to hit endpoints in real time
> In-app spec build

Honestly, I'd genuinely love feedback on
1. Is "upload spec, get live mock" the right abstraction, or do teams want Postman-style manual response definition?
2. Would you use this for integration testing in CI, or is a 3-7s cold start too slow for that?
3. Anyone building against gRPC or GraphQL specs? That's on the roadmap but I want to know if it's actually a blocker too.

Would genuinely appreciate any feedback — especially from QA engineers or anyone who's tried to solve this a different way.

https://mockline.xyz

Add products that helped make yours awesome

Contour CLI — for mock server generation
