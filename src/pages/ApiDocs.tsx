import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code, Book, Zap, Shield } from 'lucide-react';

export default function ApiDocs() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive guide to the UPGE API endpoints
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <Code className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">REST API</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              HTTP-based API with JSON responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Shield className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">JWT Auth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Secure authentication with bearer tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Rate Limited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              5-60 calls/min based on environment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Book className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">OpenAPI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              OpenAPI 3.0 specification available
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base URL</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block p-3 bg-muted rounded-md text-sm">
                https://pocnysyzkbluasjwgcqy.supabase.co/functions/v1
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
              <CardDescription>Limits vary by environment mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">Sandbox</Badge>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• 5-20 calls per minute</li>
                  <li>• 50-200 calls per hour</li>
                  <li>• 100-500 calls per day</li>
                  <li>• $1 daily budget limit</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">Production</Badge>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• 60-200 calls per minute</li>
                  <li>• 1000-4000 calls per hour</li>
                  <li>• 5000-20000 calls per day</li>
                  <li>• Monthly budget limit only</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>POST /run-comparison</CardTitle>
              <CardDescription>Compare multiple AI models</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`{
  "prompt": "Write a haiku about coding",
  "models": ["gpt-5-mini", "gemini-2.5-flash"]
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`{
  "success": true,
  "responses": [
    {
      "model": "gpt-5-mini",
      "output": "Code flows like water...",
      "latency_ms": 1234,
      "cost": 0.0012
    }
  ]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>POST /generate-insights</CardTitle>
              <CardDescription>Generate AI-powered insights from test runs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`{
  "userId": "uuid",
  "testRuns": ["run-id-1", "run-id-2"]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>POST /generate-prompt</CardTitle>
              <CardDescription>Generate optimized prompts using AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`{
  "problem": "Describe the problem",
  "goal_type": "optimization",
  "format": "structured"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>All endpoints require JWT authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Authorization Header</h4>
                <code className="block p-3 bg-muted rounded-md text-sm">
                  Authorization: Bearer YOUR_JWT_TOKEN
                </code>
              </div>
              <div>
                <h4 className="font-medium mb-2">Getting a Token</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Sign in through the app to receive a JWT token. The token is stored in your browser's localStorage.
                </p>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`// Get token from localStorage
const token = localStorage.getItem('sb-access-token');

// Use in fetch request
fetch('https://[url]/functions/v1/run-comparison', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* ... */ })
})`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>JavaScript Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`const token = 'your-jwt-token';

async function compareModels() {
  const response = await fetch(
    'https://pocnysyzkbluasjwgcqy.supabase.co/functions/v1/run-comparison',
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Explain quantum computing',
        models: ['gpt-5-mini', 'gemini-2.5-flash']
      })
    }
  );
  
  const data = await response.json();
  console.log(data);
}

compareModels();`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>cURL Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`curl -X POST \\
  https://pocnysyzkbluasjwgcqy.supabase.co/functions/v1/run-comparison \\
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "prompt": "Explain quantum computing",
    "models": ["gpt-5-mini", "gemini-2.5-flash"]
  }'`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Python Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`import requests

token = 'your-jwt-token'
url = 'https://pocnysyzkbluasjwgcqy.supabase.co/functions/v1/run-comparison'

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

data = {
    'prompt': 'Explain quantum computing',
    'models': ['gpt-5-mini', 'gemini-2.5-flash']
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
