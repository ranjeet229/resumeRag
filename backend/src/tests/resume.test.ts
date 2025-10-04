import { testClient, createTestUser, mockFileUpload } from '../test/setup';
import { UserRole } from '../models/user.model';

describe('Resume Upload API', () => {
  it('should successfully upload a single resume', async () => {
    // Create a test user
    const { token } = await createTestUser();

    // Attempt to upload a resume
    const response = await testClient
      .post('/api/resumes/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test resume content'), 'resume.pdf');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('filename', 'resume.pdf');
    expect(response.body).toHaveProperty('status', 'success');
  });

  it('should handle invalid file types', async () => {
    const { token } = await createTestUser();

    const response = await testClient
      .post('/api/resumes/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('invalid file'), 'invalid.txt');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should require authentication', async () => {
    const response = await testClient
      .post('/api/resumes/upload')
      .attach('file', Buffer.from('test content'), 'resume.pdf');

    expect(response.status).toBe(401);
  });

  it('should handle bulk upload via ZIP', async () => {
    const { token } = await createTestUser();

    // Mock ZIP file content
    const zipContent = Buffer.from('mock zip content');

    const response = await testClient
      .post('/api/resumes/upload/bulk')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', zipContent, 'resumes.zip');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});