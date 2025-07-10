import { Router } from 'express';
import multer from 'multer';
import { FacialRecognitionController } from '../controllers/facial-recognition.controller';
import { authenticateJWT, optionalAuthenticateJWT } from '../middlewares/authMiddleware';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const isDevelopment = process.env.NODE_ENV === 'development';

export const facialRecognitionRouter = Router();

const facialRecognitionController = new FacialRecognitionController();

facialRecognitionRouter.post(
  '/initialize',
  isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
  (req, res) => facialRecognitionController.initializeOrganization(req, res)
);

facialRecognitionRouter.post(
  '/register',
  isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
  upload.any(),
  (req, res) => facialRecognitionController.registerPerson(req, res)
);

facialRecognitionRouter.post(
  '/recognize',
  isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
  upload.single('image'),
  (req, res) => facialRecognitionController.recognizeFace(req, res)
);

facialRecognitionRouter.get(
  '/persons',
  isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
  (req, res) => facialRecognitionController.getPersons(req, res)
);

facialRecognitionRouter.put(
  '/persons/:id',
  isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
  upload.any(),
  (req, res) => facialRecognitionController.updatePerson(req, res)
);

facialRecognitionRouter.delete(
  '/persons/:id',
  isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
  (req, res) => facialRecognitionController.deletePerson(req, res)
);

facialRecognitionRouter.get(
  '/config',
  isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
  (req, res) => facialRecognitionController.getConfig(req, res)
); 