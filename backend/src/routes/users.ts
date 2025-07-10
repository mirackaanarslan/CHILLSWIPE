import { Router } from 'express';

const router = Router();

// GET /users/me - Get current user profile
router.get('/me', async (req, res) => {
  try {
    // This would need authentication middleware
    res.json({
      success: true,
      data: null,
      message: 'User authentication coming soon'
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

export { router as usersRouter }; 