# Advanced Tutoring Platform

A modular Node.js-based tutoring website that connects tutors with pupils.

## Features

- **User Roles**: Admin, Tutor, and Pupil roles with different permissions
- **Access Code System**: Invitation-based registration using access codes
- **Email Verification**: Optional email verification for user registration
- **Messaging System**: Direct communication between tutors and pupils
- **Dashboard**: Role-specific dashboards for users
- **JSON Storage**: Uses JSON files for data storage (no database required)

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/advancedtutoring.git
   cd advancedtutoring
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file and set your own values for:
   - JWT_SECRET and SESSION_SECRET (security keys)
   - Email configuration (if you want to enable email)
   - Admin credentials

## Usage

### Development

To run the application in development mode with auto-restart:

```
npm run dev
```

### Production

To run the application in production mode:

```
npm start
```

The application will be available at http://localhost:3000 (or the PORT specified in your .env file).

## Default Admin

On first run, the system will create a default admin user with credentials from the `.env` file. You can use this admin account to:

1. Create tutor accounts by generating access codes
2. Manage users
3. Access all system features

## User Registration Flow

1. Admin creates access codes for tutors
2. Tutors register using the access codes
3. Tutors create access codes for pupils
4. Pupils register using the access codes
5. If email verification is enabled, users must verify their email before full access

## Project Structure

- **config/**: Configuration files
- **controllers/**: Request handlers for routes
- **data/**: JSON data storage
- **middleware/**: Express middlewares
- **models/**: Data models
- **public/**: Static assets (CSS, JavaScript, images)
- **routes/**: API route definitions
- **utils/**: Utility functions
- **views/**: EJS templates for rendering pages

## Customization

### Email Templates

Email templates can be modified in the `utils/email.js` file.

### Styling

The application uses a simple CSS framework in `public/css/styles.css`. You can modify this file to change the appearance.

## Security Considerations

- Change the default admin credentials in the `.env` file
- Set strong JWT_SECRET and SESSION_SECRET values
- In production, enable HTTPS by setting up a reverse proxy (like Nginx)
- Consider implementing rate limiting for API endpoints

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
