# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| Latest  | ✅                 |

## Reporting a Vulnerability

If you discover a security vulnerability in Family Health Keeper, please report it to us privately before disclosing it publicly.

### How to Report

- **Email**: security@familyhealthkeeper.app
- **Private Issue**: Create a private issue on our GitHub repository

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, CSRF, authentication bypass)
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any screenshots or proof-of-concept code

### Response Time

- **Critical**: Within 24 hours
- **High**: Within 48 hours
- **Medium**: Within 72 hours
- **Low**: Within 1 week

## Security Features

Family Health Keeper implements several security measures:

### Data Protection
- **Client-side encryption**: All medical data is encrypted before storage
- **Local storage**: Data is stored locally in the browser using IndexedDB
- **No server storage**: We don't store or transmit your medical data to our servers

### Application Security
- **Content Security Policy**: Prevents XSS attacks
- **HTTPS enforced**: All connections use secure HTTPS
- **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.

### API Security
- **Environment variables**: API keys are stored securely in environment variables
- **Rate limiting**: Applied to external API calls
- **Input validation**: All user inputs are validated and sanitized

## Best Practices for Users

1. **Use strong passwords**: If you implement authentication, use strong, unique passwords
2. **Keep software updated**: Use the latest version of your web browser
3. **Secure your device**: Ensure your device is locked and protected
4. **Regular backups**: Regularly export and backup your health data
5. **Check URLs**: Always verify you're on the correct website

## Responsible Disclosure

We appreciate responsible disclosure and will:

1. **Acknowledge** your report within the response time
2. **Investigate** the vulnerability promptly
3. **Provide updates** on our progress
4. **Credit** you in our security acknowledgments (if you wish)
5. **Fix** the issue before disclosing it publicly

## Security Acknowledgments

We thank the security community for helping us keep Family Health Keeper secure.

## Security Updates

Security updates are automatically deployed to Netlify-hosted sites. Users of self-hosted versions should update regularly.

## Contact

For security-related questions that aren't vulnerability reports, please contact us at security@familyhealthkeeper.app