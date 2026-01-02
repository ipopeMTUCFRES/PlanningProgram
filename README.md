# Tree Survey Application

A comprehensive web application for managing tree survey projects with GPS tracking, crew management, and audit capabilities. Built for tree care professionals to plan, execute, and monitor tree maintenance work.

## Features

### Three Operating Modes

#### 1. Planning Mode (Entry Mode)
- Create and manage projects organized by work type (Maintenance, Repetitive Outage, Zonal-Clearing, etc.)
- Organize projects into sections for better management of large projects
- Create groups within sections with detailed specifications:
  - Circuit numbers, section numbers, and ID numbers
  - Brush amount tracking (quarter spans)
  - Cutting equipment requirements (Bucket Truck, Manual, Backyard Machine, etc.)
  - Cleanup codes (Chipper, Mower, Windrow)
  - Customer notification methods (Verbal, Door-Card, Postcard)
- Record individual trees with:
  - GPS coordinates (manual entry or automatic browser geolocation)
  - Species, diameter, and health condition
  - Tree type (Primary/Secondary)
  - Required action (trim, remove, hazard)
  - Custom notes
- View trees on interactive maps with OpenStreetMap integration

#### 2. Crew Mode (Working Mode)
- Navigate through projects and sections to find assigned work
- View groups with completion status tracking
- Mark individual trees as completed
- Automatically mark groups as completed when all trees are done
- Track progress with visual status indicators (Completed, In Progress, Not Started)

#### 3. Audit Mode
- View completion statistics at project and section levels
- See percentage completion for all groups
- Interactive maps showing group locations color-coded by status
- Drill down from projects → sections → groups for detailed analysis

## Installation

### Prerequisites
- **Node.js** (version 14 or higher) - Download from [https://nodejs.org/](https://nodejs.org/)
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection for map tiles (OpenStreetMap)

### Quick Start

1. **Download or clone this repository**
   ```bash
   git clone <repository-url>
   cd "Planning Software"
   ```

   Or download and extract the ZIP file to a folder

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open in your browser**
   ```
   http://localhost:3000
   ```

The application will automatically create a `tree_survey.json` database file on first run.

## Usage Guide

### Getting Started

1. **Create a Project** (Planning Mode)
   - Click "Entry Mode" at the top
   - Click "Create New Project"
   - Enter project name and select work type
   - Click "Save Project"

2. **Create Sections**
   - After saving a project, click "Create New Section"
   - Enter section name (e.g., "North Area", "Phase 1") and description
   - Click "Save Section"

3. **Create Groups**
   - Within a section, click "Create New Group"
   - Fill in:
     - Circuit Number (format: 1234-56)
     - Section Number and ID Number
     - Comments, brush amount
     - Required equipment and cleanup codes
     - Customer notification preferences
   - Click "Save Group"

4. **Record Trees**
   - Within a group, use the "Record Trees for This Group" form
   - Click "Get Current Location" to auto-fill GPS coordinates
   - Enter tree details (species, diameter, type, action, health condition)
   - Add notes if needed
   - Click "Save Tree"
   - Trees appear on the map below

### Crew Workflow

1. Switch to **Crew Mode**
2. Select your project
3. Select the section you're working on
4. Select the group
5. Mark individual trees as completed by clicking "Mark as Completed"
6. When all trees are done, click "Mark Group as Completed"

### Audit & Monitoring

1. Switch to **Audit Mode**
2. Select a project to view overall progress
3. Select a section to see detailed group status
4. View the map showing all groups color-coded by completion status
5. Review individual group completion percentages

## Data Management

### Database Location
All data is stored in `tree_survey.json` in the application directory. This file contains:
- Projects
- Sections
- Groups
- Tree records
- Completion status

### Backup Your Data
**Important:** Regularly backup your `tree_survey.json` file to prevent data loss.

```bash
# Create a backup
cp tree_survey.json tree_survey_backup_$(date +%Y%m%d).json
```

### Sharing Data
To share your survey data with others:
1. Copy the `tree_survey.json` file
2. Send it to other users
3. They can place it in their application directory before starting the app

### Exporting Data
The JSON file can be:
- Opened in any text editor
- Imported into Excel/Google Sheets using JSON import tools
- Processed with custom scripts for reporting

## Deployment Options

### Local Network Access

To allow other devices on your network to access the application:

1. Find your computer's IP address:
   ```bash
   # On Mac/Linux
   ifconfig | grep "inet "

   # On Windows
   ipconfig
   ```

2. Other devices can access at:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

### Cloud Deployment

The application can be deployed to cloud platforms:

#### Heroku
```bash
# Install Heroku CLI, then:
heroku create your-app-name
git push heroku main
```

#### DigitalOcean/AWS/Azure
- Upload files to your server
- Install Node.js
- Run `npm install` and `npm start`
- Configure firewall to allow port 3000
- Consider using PM2 for process management:
  ```bash
  npm install -g pm2
  pm2 start server.js
  pm2 startup
  ```

### Running as a Service

To keep the application running in the background:

**Using PM2 (recommended):**
```bash
npm install -g pm2
pm2 start server.js --name tree-survey
pm2 save
pm2 startup
```

## Browser Compatibility

- **GPS Location:** Requires HTTPS (except on localhost) and Geolocation API support
- **Best Performance:** Chrome, Edge, Firefox, Safari (desktop and mobile)
- **Maps:** Requires internet connection for OpenStreetMap tiles

## File Structure

```
Planning Software/
├── server.js              # Express server and API endpoints
├── database.js            # JSON database operations
├── package.json           # Project dependencies and scripts
├── tree_survey.json       # JSON database (auto-created)
├── public/
│   ├── index.html         # Main HTML structure
│   ├── styles.css         # Retro Windows 95-style CSS
│   └── app.js             # Frontend JavaScript (all modes)
└── README.md              # This file
```

## Technical Details

- **Backend:** Node.js with Express
- **Frontend:** Vanilla JavaScript (no frameworks)
- **Database:** JSON file-based storage
- **Maps:** Leaflet.js with OpenStreetMap tiles
- **Styling:** Retro Windows 95 theme

## Troubleshooting

### Application won't start
- Ensure Node.js is installed: `node --version`
- Check if port 3000 is available
- Try a different port: `PORT=3001 npm start`

### GPS not working
- Enable location services in your browser
- Use HTTPS or localhost
- Check browser permissions for location access

### Data not saving
- Check file permissions on `tree_survey.json`
- Ensure sufficient disk space
- Check browser console for errors (F12)

### Map not loading
- Verify internet connection
- Check if OpenStreetMap is accessible
- Clear browser cache

## Support & Contributions

For issues, questions, or contributions, please refer to the repository's issue tracker.

## License

This project is provided as-is for tree survey management purposes.

## Version History

- **v2.0.0** - Added sections, three-mode system (Planning/Crew/Audit)
- **v1.0.0** - Initial release with basic tree and group management
