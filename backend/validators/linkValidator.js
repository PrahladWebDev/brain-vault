import { body } from 'express-validator';

export const saveLinkValidator = [
  body('url').trim().notEmpty().withMessage('URL is required').isURL({ require_protocol: true }).withMessage('Must be a valid URL including http(s)://'),
];

export const updateLinkValidator = [
  body('title').optional().isString().isLength({ max: 300 }),
  body('notes').optional().isString(),
  body('tags').optional().isArray(),
  body('category').optional().isString(),
];
