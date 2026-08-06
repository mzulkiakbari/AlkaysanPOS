import { ShapeMode } from '../types';

export function ShapeCSSTheme(shape: ShapeMode) {
  switch (shape) {
    case 'rectangular':
      return {
        borderRadius: 0,
      };
      break;

    case 'circle':
      return {
        borderRadius: '50%',
      };
      break;

    case 'pill':
      return {
        borderRadius: '9999px',
      };
      break;

    case 'square':
      return {
        borderRadius: 0,
      };
      break;

    default:
      return {
        borderRadius: 0,
      };
      break;
  }
}

const defaultColor = '#ed3237';
const boxShadow = 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px';

export const Theme = {
  filled_default: {
    backgroundColor: defaultColor,
    boxShadow: boxShadow,
    color: '#fff',
    border: `${defaultColor} 1px solid`,
    cursor: 'pointer',
  },
  filled_dark: {
    backgroundColor: '#fff',
    boxShadow: boxShadow,
    color: '#000',
    border: '#fff 1px solid',
    cursor: 'pointer',
  },
  Rounded: ShapeCSSTheme("pill"),
};
