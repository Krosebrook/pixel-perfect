# Deployment Metrics Dashboard

## Overview

The Deployment Metrics Dashboard provides comprehensive visibility into your CI/CD pipeline health, tracking deployment success rates, rollback frequency, incident resolution times, and deployment duration over the past 30 days.

## Features

### Key Metrics

1. **Success Rate**
   - Percentage of successful deployments
   - Total deployments vs successful deployments
   - Calculated over 30-day rolling window

2. **Rollback Frequency**
   - Count of automatic rollbacks triggered
   - Indicates deployment health and stability
   - Tracks health check failures

3. **Average Deployment Duration**
   - Mean time from deployment start to completion
   - Helps identify performance bottlenecks
   - Excludes failed/rolled-back deployments

4. **Incident Resolution Time**
   - Average time to resolve incidents
   - Number of resolved vs total incidents
   - Tracks team response effectiveness

### Visualizations

#### Deployment Trend Chart
- Line chart showing daily deployment activity
- Tracks success, failed, and rolled-back deployments
- 30-day historical view
- Helps identify patterns and trends

#### Status Distribution
- Pie chart of deployment outcomes
- Visual breakdown of success vs failures
- Quick health check of recent deployments

### Data Tables

#### Recent Deployments
- Last 10 production deployments
- Includes:
  - Commit SHA
  - Deployment status
  - Health check results
  - Deployment duration
  - Timestamp
  - Direct links to deployed URLs

#### Recent Incidents
- Latest deployment incidents
- Includes:
  - Incident severity and type
  - Failed health checks
  - Resolution status and time
  - Links to GitHub issues
  - Resolution notes

## Database Schema

### deployment_metrics Table

Tracks all deployment attempts:

```sql
CREATE TABLE deployment_metrics (
  id UUID PRIMARY KEY,
  deployment_type TEXT, -- 'production' or 'preview'
  commit_sha TEXT,
  workflow_run_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT, -- 'pending', 'success', 'failed', 'rolled_back'
  health_check_status TEXT, -- 'healthy', 'unhealthy', 'skipped'
  deployment_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ
);
```

### deployment_incidents Table

Tracks incidents and resolution:

```sql
CREATE TABLE deployment_incidents (
  id UUID PRIMARY KEY,
  deployment_id UUID REFERENCES deployment_metrics(id),
  incident_type TEXT, -- 'health_check_failure', 'deployment_failure', 'rollback_failure'
  severity TEXT, -- 'low', 'medium', 'high', 'critical'
  failed_checks TEXT[],
  github_issue_number INTEGER,
  github_issue_url TEXT,
  detected_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_time_minutes INTEGER,
  resolution_notes TEXT
);
```

## Data Collection

### GitHub Actions Integration

Deployment metrics are automatically collected from GitHub Actions workflows. The workflows send data to the `track-deployment` edge function.

**Example: Tracking a deployment**

```yaml
- name: Track Deployment Start
  run: |
    curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/track-deployment" \
      -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "track_deployment",
        "data": {
          "deployment_type": "production",
          "commit_sha": "${{ github.sha }}",
          "workflow_run_id": "${{ github.run_id }}",
          "started_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
          "status": "pending",
          "deployment_url": "https://example.com"
        }
      }'
```

**Example: Updating deployment status**

```yaml
- name: Update Deployment Status
  run: |
    curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/track-deployment" \
      -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "update_deployment",
        "data": {
          "id": "${{ github.run_id }}",
          "completed_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
          "status": "success",
          "health_check_status": "healthy",
          "duration_seconds": 180
        }
      }'
```

**Example: Tracking an incident**

```yaml
- name: Track Incident
  run: |
    curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/track-deployment" \
      -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "track_incident",
        "data": {
          "deployment_id": "${{ steps.find-deployment.outputs.id }}",
          "incident_type": "health_check_failure",
          "severity": "high",
          "failed_checks": ["HTTP Status Check Failed (500)", "Content Validation Failed"],
          "github_issue_number": ${{ steps.create-issue.outputs.number }},
          "github_issue_url": "${{ steps.create-issue.outputs.url }}"
        }
      }'
```

### Edge Function API

The `track-deployment` edge function supports the following actions:

#### `track_deployment`
Creates a new deployment record.

**Request:**
```json
{
  "action": "track_deployment",
  "data": {
    "deployment_type": "production",
    "commit_sha": "abc123",
    "workflow_run_id": "123456",
    "started_at": "2024-01-01T00:00:00Z",
    "status": "pending"
  }
}
```

#### `update_deployment`
Updates an existing deployment record.

**Request:**
```json
{
  "action": "update_deployment",
  "data": {
    "id": "workflow_run_id",
    "completed_at": "2024-01-01T00:05:00Z",
    "status": "success",
    "health_check_status": "healthy",
    "duration_seconds": 300
  }
}
```

#### `track_incident`
Creates a new incident record.

**Request:**
```json
{
  "action": "track_incident",
  "data": {
    "deployment_id": "uuid",
    "incident_type": "health_check_failure",
    "severity": "high",
    "failed_checks": ["HTTP 500", "Invalid Content"],
    "github_issue_number": 123,
    "github_issue_url": "https://github.com/..."
  }
}
```

#### `resolve_incident`
Marks an incident as resolved.

**Request:**
```json
{
  "action": "resolve_incident",
  "data": {
    "id": "incident_uuid",
    "resolution_notes": "Fixed by reverting breaking change"
  }
}
```

## Accessing the Dashboard

1. Navigate to `/deployment-metrics` in your application
2. The dashboard is protected by authentication
3. All team members with access can view metrics
4. Data is read-only for regular users

## Interpreting Metrics

### Success Rate
- **>95%**: Excellent - CI/CD pipeline is stable
- **90-95%**: Good - Minor issues, monitor trends
- **80-90%**: Fair - Investigate failure patterns
- **<80%**: Poor - Requires immediate attention

### Rollback Frequency
- **0-2/month**: Excellent - Stable deployments
- **3-5/month**: Acceptable - Review testing process
- **>5/month**: Concerning - Improve pre-deployment testing

### Average Duration
- **<5 minutes**: Excellent
- **5-10 minutes**: Good
- **10-15 minutes**: Fair - Consider optimization
- **>15 minutes**: Slow - Review build process

### Resolution Time
- **<30 minutes**: Excellent response time
- **30-60 minutes**: Good
- **1-2 hours**: Acceptable for complex issues
- **>2 hours**: May need process improvements

## Best Practices

1. **Monitor Trends**
   - Review metrics weekly
   - Look for patterns in failures
   - Track improvement over time

2. **Investigate Incidents**
   - Review all incidents promptly
   - Document resolution steps
   - Update processes to prevent recurrence

3. **Set Team Goals**
   - Target 95%+ success rate
   - Aim for <5 rollbacks per month
   - Reduce resolution time continuously

4. **Use Data for Improvement**
   - Identify common failure causes
   - Improve testing based on patterns
   - Optimize slow deployment steps

## Troubleshooting

### No Data Showing
- Verify edge function is deployed
- Check GitHub Actions workflows are running
- Confirm SUPABASE_SERVICE_ROLE_KEY is configured in GitHub secrets

### Incorrect Metrics
- Verify workflow timestamps are in UTC
- Check deployment status values match schema constraints
- Review edge function logs for errors

### Missing Incidents
- Ensure incident tracking calls are in failure paths
- Verify deployment_id references are correct
- Check GitHub issue creation is successful

## Related Documentation

- [CI/CD Pipeline Documentation](./CI-CD.md)
- [Production Health Check & Rollback](./CI-CD.md#production-health-check--rollback)
- [GitHub Actions Workflows](../.github/workflows/)
