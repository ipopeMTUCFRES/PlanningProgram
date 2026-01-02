# Mobile Setup Guide for Tree Survey Application

Your Tree Survey Application is now a Progressive Web App (PWA) that can be installed and used on mobile devices!

## What's New

### PWA Features
- **Installable**: Add the app to your phone's home screen like a native app
- **Offline Support**: Continue working even without internet connection
- **Mobile-Optimized**: Responsive design for phones and tablets
- **Touch-Friendly**: Larger buttons and form fields for easy touch interaction
- **Better Maps**: Enhanced map controls for touch and pinch-to-zoom

### Mobile Enhancements
- All buttons are now 44px minimum height (Apple's recommended touch target size)
- Form fields are 16px font size to prevent auto-zoom on iOS
- Larger map markers (24px) for easier tapping
- Full-width buttons on mobile for easier access
- Optimized layout that stacks vertically on small screens
- Better checkbox and radio button touch targets

## How to Use on Mobile

### Option 1: Local Network Access (WiFi)

1. **Find Your Computer's IP Address**
   - Mac: System Settings → Network → Your connection → Details → IP address
   - Windows: Open Command Prompt → Type `ipconfig` → Look for IPv4 Address

2. **On Your Phone (same WiFi network)**
   - Open your mobile browser (Safari, Chrome, etc.)
   - Go to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

3. **Install as App**

   **On iOS (Safari):**
   - Tap the Share button (square with arrow)
   - Scroll down and tap "Add to Home Screen"
   - Tap "Add"
   - The app icon will appear on your home screen

   **On Android (Chrome):**
   - Tap the menu (three dots)
   - Tap "Add to Home Screen" or "Install app"
   - Tap "Add" or "Install"
   - The app icon will appear on your home screen

### Option 2: Deploy to the Internet

For remote access from anywhere, deploy the app to a cloud service:

#### Free Hosting Options:

1. **Render** (Recommended for beginners)
   - Go to https://render.com
   - Sign up for free account
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect and deploy your Node.js app
   - You'll get a URL like: `https://your-app.onrender.com`

2. **Railway**
   - Go to https://railway.app
   - Connect GitHub and select your repository
   - Railway auto-deploys your app
   - Free tier includes 500 hours/month

3. **Heroku** (Requires credit card for verification)
   - Install Heroku CLI
   - Run: `heroku login`
   - Run: `heroku create your-app-name`
   - Run: `git push heroku main`

See `DEPLOYMENT.md` for detailed deployment instructions.

## Mobile Features Breakdown

### Responsive Design
- **Phone (<768px)**: Single column layout, full-width buttons
- **Tablet (769-1024px)**: Two-column forms, optimized spacing
- **Landscape**: Adjusted header and map heights

### Touch Optimizations
- Minimum 44x44px touch targets for all interactive elements
- 16px minimum font size in form fields (prevents iOS auto-zoom)
- Larger checkboxes (20x20px) with more padding
- Enhanced map marker size (24px vs 16px)
- Better tap tolerance on maps (15px)

### Offline Capability
The app caches:
- All HTML, CSS, and JavaScript files
- Map tile library (Leaflet)
- API responses for offline viewing
- Your tree survey data

When offline:
- ✅ View existing projects, sections, groups, and trees
- ✅ View maps with cached data
- ✅ Export data to CSV
- ❌ Cannot create/edit/delete (requires server)

### GPS/Location Access
- Works on mobile browsers when using HTTPS
- For local testing, use: `http://localhost:3000` directly on phone OR use HTTPS deployment
- Modern browsers require secure context (HTTPS) for geolocation

## Testing the PWA

### Test on Desktop First
1. Open Chrome or Edge
2. Go to `http://localhost:3000`
3. Open DevTools (F12)
4. Click "Application" tab
5. Check "Manifest" - should show Tree Survey app details
6. Check "Service Workers" - should show registered worker
7. In top bar, you should see an install icon

### Test on Mobile
1. Access the app via local network or deployed URL
2. Try the "Add to Home Screen" feature
3. Test offline mode:
   - Load the app while online
   - Enable airplane mode
   - Refresh - app should still work
   - Try viewing existing data
4. Test responsiveness:
   - Rotate device to test landscape mode
   - Try all buttons - should be easy to tap
   - Test form inputs - no auto-zoom on focus
   - Test map controls - pinch to zoom, drag, tap markers

## Troubleshooting

### "Add to Home Screen" Not Showing
- Make sure you're using Safari on iOS or Chrome on Android
- App must be loaded via HTTPS (or localhost for testing)
- Service worker must be registered successfully
- Check browser console for errors

### App Won't Work Offline
- Make sure you loaded the app at least once while online
- Check DevTools → Application → Cache Storage
- Verify service worker is active (not waiting or redundant)
- Try clearing cache and reloading

### GPS Not Working on Mobile
- Grant location permissions when prompted
- For local network access, GPS may be blocked (use HTTPS deployment)
- Check that geolocation is enabled in phone settings
- Some browsers require HTTPS for geolocation

### Forms Too Small to Tap
- Make sure viewport meta tag is present in HTML
- Check that CSS is loading correctly
- Try hard refresh: Ctrl+Shift+R (desktop) or clear browser cache (mobile)

### Maps Not Loading
- Check internet connection (maps require online access for tiles)
- Verify Leaflet library is loading
- Check browser console for errors
- Ensure map container has explicit height in CSS

## Performance Tips

### For Better Mobile Performance:
1. Use WiFi when possible for initial load
2. Allow app to cache (first load will be slower)
3. Export large sections periodically to reduce data size
4. Clear completed trees from Crew Mode when done

### Battery Saving:
- GPS uses significant battery - use sparingly
- Close app when not in use
- Consider dark mode (already implemented) for OLED screens

## Next Steps

Want to enhance the mobile experience further?

1. **Add Geolocation Button**: Auto-fill lat/long from GPS
2. **Camera Integration**: Take tree photos
3. **Background Sync**: Queue changes offline, sync when online
4. **Push Notifications**: Alert crew members of updates
5. **Native App Wrapper**: Use Capacitor for true native features

Let me know which features you'd like to add next!

## Support

For issues or questions:
- Check browser console for error messages
- Verify all files are being served correctly
- Test on different devices/browsers
- Check that manifest.json is valid at: https://manifest-validator.appspot.com/
