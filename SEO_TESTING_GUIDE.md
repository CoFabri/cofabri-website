# SEO Testing Guide for CoFabri

This guide provides comprehensive testing procedures to verify that all SEO changes are working correctly.

## 🧪 **Automated Testing**

### Quick Test Script
Run the automated test script to verify all SEO changes:

```bash
# Start the development server
npm run dev

# In another terminal, run the test script
node test-seo-changes.js
```

**Expected Results:**
- ✅ All 10 tests should pass
- ✅ 100% success rate
- ✅ All redirects working correctly

## 🔍 **Manual Testing Checklist**

### 1. **404 Error Redirects**

Test these URLs in your browser to verify redirects:

| URL | Expected Result |
|-----|----------------|
| `http://localhost:3000/privacy` | Should redirect to `/legal` |
| `http://localhost:3000/knowledge-base/faq` | Should redirect to `/knowledge-base` |
| `http://localhost:3000/knowledge-base/getting-started` | Should redirect to `/knowledge-base` |
| `http://localhost:3000/knowledge-base/api-docs` | Should redirect to `/knowledge-base` |
| `http://localhost:3000/knowledge-base/troubleshooting` | Should redirect to `/knowledge-base` |

### 2. **URL Normalization Tests**

Test legal document URL variations:

| URL | Expected Result |
|-----|----------------|
| `http://localhost:3000/legal?document=CertiFi Central - Privacy Policy` | Should redirect to normalized version |
| `http://localhost:3000/legal?document=CertiFi%20Central%20-%20Privacy%20Policy` | Should redirect to normalized version |
| `http://localhost:3000/legal?document=CertiFi+Central+-+Privacy+Policy` | Should stay on this page (already normalized) |

### 3. **Normal Page Functionality**

Verify these pages still work correctly:

| URL | Expected Result |
|-----|----------------|
| `http://localhost:3000/` | Homepage loads normally |
| `http://localhost:3000/legal` | Legal page loads normally |
| `http://localhost:3000/knowledge-base` | Knowledge base loads normally |
| `http://localhost:3000/apps` | Apps page loads normally |
| `http://localhost:3000/contact` | Contact page loads normally |

### 4. **Canonical URL Verification**

Check that canonical URLs are properly set:

1. **View Page Source** on each page
2. **Look for** `<link rel="canonical" href="...">` tags
3. **Verify** canonical URLs point to the correct pages

### 5. **Robots.txt Verification**

Test robots.txt blocking:

```bash
curl http://localhost:3000/robots.txt
```

**Expected Content:**
```
User-agent: *
Allow: /
Sitemap: https://cofabri.com/sitemap.xml
Disallow: /api/
Disallow: /preview/
Disallow: /debug/
Disallow: /health
Disallow: /api/health
Allow: /apps/
Allow: /knowledge-base/
Allow: /contact/
Allow: /roadmaps/
Allow: /status/
Allow: /support/
Allow: /legal/
Crawl-delay: 1
```

## 🛠️ **Production Testing**

### 1. **Deploy to Staging/Production**

```bash
# Build the application
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

### 2. **Test on Live Domain**

Replace `localhost:3000` with your actual domain:

| Test | URL |
|------|-----|
| Privacy redirect | `https://cofabri.com/privacy` |
| KB article redirect | `https://cofabri.com/knowledge-base/faq` |
| Legal page | `https://cofabri.com/legal` |
| Robots.txt | `https://cofabri.com/robots.txt` |

### 3. **Google Search Console Verification**

1. **Submit Updated Sitemap**
   - Go to Google Search Console
   - Navigate to Sitemaps
   - Submit: `https://cofabri.com/sitemap.xml`

2. **Request Re-indexing**
   - Use the URL Inspection tool
   - Request indexing for canonical URLs

3. **Monitor 404 Errors**
   - Check Coverage report
   - Verify 404 errors are decreasing

## 🔧 **Troubleshooting**

### Common Issues

1. **Redirects Not Working**
   - Check middleware.ts file
   - Verify build completed successfully
   - Check server logs for errors

2. **Canonical URLs Missing**
   - Verify metadata.ts files
   - Check page source for canonical tags
   - Ensure proper import of metadata

3. **Robots.txt Not Updated**
   - Check public/robots.txt file
   - Verify deployment included the file
   - Clear CDN cache if applicable

### Debug Commands

```bash
# Check build status
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Test specific redirect
curl -I http://localhost:3000/privacy

# Check robots.txt
curl http://localhost:3000/robots.txt

# View page source for canonical URLs
curl http://localhost:3000/legal | grep -i canonical
```

## 📊 **Success Metrics**

### Immediate Verification
- ✅ All redirects return 307 status codes
- ✅ Canonical URLs present in page source
- ✅ Robots.txt contains proper directives
- ✅ No build errors or warnings

### Long-term Monitoring
- 📈 404 errors decrease in Google Search Console
- 📈 Duplicate content issues resolve
- 📈 Search rankings improve
- 📈 Crawl efficiency increases

## 🚀 **Next Steps After Testing**

1. **Deploy to Production**
2. **Submit Sitemap to Google Search Console**
3. **Monitor Google Search Console for 2-4 weeks**
4. **Check for resolution of duplicate content issues**
5. **Verify 404 errors are decreasing**

---

**Last Updated:** December 2024
**Test Status:** ✅ All tests passing
**Ready for Production:** ✅ Yes
