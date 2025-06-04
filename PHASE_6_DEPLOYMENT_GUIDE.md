# Phase 6 Deployment Preparation Guide

This document provides the final deployment checklist for the Phase 6 features including Admin Portal, White-label/Agency Mode, Monetization & Pricing System, Customer Support & Feedback, and Enhanced System Monitoring.

## 1. Environment Variables

Ensure the following environment variables are properly set in your production environment:

```
# Core Application
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Database
DATABASE_URL=your_production_database_url

# Authentication
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXTAUTH_URL=https://your-production-domain.com

# Email Configuration
EMAIL_SERVER_HOST=your_smtp_server
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_smtp_username
EMAIL_SERVER_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@your-domain.com
EMAIL_SERVER_SECURE=false

# Stripe Integration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Storage (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Feature Flags (optional)
ENABLE_ANALYTICS_TRACKING=true
ENABLE_BETA_FEATURES=false
```

## 2. Database Migrations

Run database migrations to ensure all required tables for Phase 6 are created:

```bash
npx prisma migrate deploy
```

## 3. Initial Data Setup

Run the following script to set up required initial data:

```bash
node test-phase6-final-verification.js
```

This will ensure:
- Default subscription plans exist
- Admin user exists
- Support categories are created
- Default feature flags are set up

## 4. Stripe Webhook Configuration

Ensure your Stripe webhook is properly configured to point to:

```
https://your-production-domain.com/api/subscriptions/webhook
```

Required events to monitor:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 5. Email Templates

Verify that all email templates render correctly:
- Workspace invitations
- Support ticket notifications
- Subscription notifications

## 6. Security Checks

- Verify admin routes are properly protected
- Ensure proper CORS configuration
- Check rate limiting on critical endpoints
- Validate proper handling of webhook signatures

## 7. Load Testing

Run load tests on the following critical paths:
- Dashboard loading performance
- API response times for subscription data
- Admin portal statistics

## 8. Monitoring Setup

- Configure error logging with proper alerts
- Set up performance monitoring
- Ensure audit logs are being properly generated

## 9. Backup Configuration

- Verify database backup schedule
- Ensure proper retention policy
- Test backup restoration process

## 10. Final Verification

Run through the following user stories to verify end-to-end functionality:

1. **Admin Dashboard**: 
   - Login as admin
   - View system stats
   - Manage users and subscriptions

2. **User Subscription**:
   - Register new account
   - Subscribe to paid plan
   - Verify feature access
   - Cancel subscription

3. **Workspace Collaboration**:
   - Create workspace
   - Invite team members
   - Verify collaboration features

4. **Customer Support**:
   - Submit support ticket
   - Verify admin notification
   - Respond as admin
   - Verify user notification

5. **System Monitoring**:
   - Toggle feature flags
   - Verify changes reflect in UI
   - Check audit logs for activities

## Post-Deployment Monitoring

After deployment, monitor the following metrics for at least 48 hours:
- Error rates
- API response times
- Subscription conversion rates
- Support ticket response times
- Database performance metrics

## Rollback Plan

In case of critical issues, follow this rollback procedure:
1. Revert to previous stable deployment
2. Restore database from latest backup if necessary
3. Notify all administrators via emergency contact protocol
4. Update status page to inform users

## Support Contact

For deployment assistance, contact:
- DevOps: devops@creatorapp.com
- Backend Team: backend@creatorapp.com
- Frontend Team: frontend@creatorapp.com
