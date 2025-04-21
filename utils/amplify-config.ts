import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  Amplify.configure({
    // Storage configuration for S3
    Storage: {
      S3: {
        bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ai-hirinmg-manager-resumes',
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
        // Add bucket authorization rules for client-side
        buckets: {
          // Use a key-value pair format instead of an array
          'ai-hirinmg-manager-resumes': {
            bucketName: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ai-hirinmg-manager-resumes',
            region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
            paths: {
              "public/*": {
                guest: ["get", "list"],
                authenticated: ["get", "list", "write", "delete"]
              },
              "protected/*": {
                guest: ["get", "list"],
                authenticated: ["get", "list"]
              },
              "protected/${cognito-identity.amazonaws.com:sub}/*": {
                entityidentity: ["get", "list", "write", "delete"]
              }
            }
          }
        }
      }
    }
  });
}

export function configureServerAmplify() {
  // For server-side, use environment credentials
  Amplify.configure({
    Storage: {
      S3: {
        bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ai-hiring-manager-bucket',
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
      }
    }
  });
  // AWS SDK will use AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from env
}
