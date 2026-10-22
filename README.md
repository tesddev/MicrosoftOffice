# Microsoft Office learning roadmap

A static, single-page learning roadmap. No build step or package installation is required.

## Add the logo

Save the Dabik Technologies logo as `logo.png` in this project folder, beside `index.html`. The page already references it in the top-left byline. Use a transparent PNG if available; the image will display at a small, responsive size.

## Preview locally

Open `index.html` in a browser. Checklist progress is saved in that browser on that device. The copy-link button works on secure hosted pages; if clipboard access is unavailable, it prompts the visitor to copy the page address from the address bar.

## Host on Vercel

1. Add `index.html`, `README.md`, and `logo.png` (once supplied) to a Git repository and push it to GitHub, GitLab, or Bitbucket.
2. Sign in at [vercel.com](https://vercel.com) and choose **Add New → Project**.
3. Import the repository containing this site.
4. In project settings, leave the framework preset as **Other**. No build command or output directory is needed for this static site.
5. Select **Deploy**. Vercel will provide a public `*.vercel.app` URL when deployment completes.
6. To publish updates, push commits to the connected repository; Vercel will redeploy automatically.

You can also deploy the folder with Vercel's CLI by running `npx vercel` from this directory and following its prompts.
