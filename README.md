# Free online assessment: setup

Layout (your existing site moves into /public; nothing else about it changes):

    api/start.js, api/submit.js, api/verify.js   serverless routes
    lib/token.js, lib/exam.js                    signing + exam settings
    data/questions.json                          question bank (server only, never served)
    public/                                      everything the site serves
      index.html (and your other existing files)
      exam.html, verify.html                     new pages
    scripts/migrate-to-public.js                 moves the old site into public/, records old URLs
    scripts/merge-vercel-json.js                 creates or merges vercel.json
    scripts/check-urls.js                        checks every old URL still answers 200
    scripts/smoke-test.js                        local tests: node scripts/smoke-test.js
    migration/old-paths.txt                      URLs the site served before this change

Rollout (production stays untouched until step 6):

1. Commit on the feature branch and push it. Vercel builds a Preview deployment.
2. Vercel > Project > Settings > Environment Variables: add CERT_SECRET for Preview and Production.
   Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
3. node scripts/check-urls.js https://<preview-url>   must print "All N URLs OK".
4. On the preview, open /data/questions.json and /lib/token.js (both must be 404), then take the exam.
5. Replace https://YOUR-DABIK-SITE/verify in public/verify.html and link /exam.html from the roadmap.
6. Merge to main. Run check-urls.js against the production URL.
7. If anything is wrong: Vercel > Deployments > previous deployment > Instant Rollback.
