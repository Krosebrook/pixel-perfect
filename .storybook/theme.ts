import { create } from '@storybook/theming/create';

export default create({
  base: 'light',
  brandTitle: 'Prompt Engineering Platform',
  brandUrl: '/',
  brandTarget: '_self',
  
  colorPrimary: 'hsl(221.2 83.2% 53.3%)',
  colorSecondary: 'hsl(221.2 83.2% 53.3%)',
  
  // UI
  appBg: 'hsl(0 0% 100%)',
  appContentBg: 'hsl(0 0% 100%)',
  appBorderColor: 'hsl(214.3 31.8% 91.4%)',
  appBorderRadius: 8,
  
  // Text colors
  textColor: 'hsl(222.2 84% 4.9%)',
  textInverseColor: 'hsl(210 40% 98%)',
  
  // Toolbar default and active colors
  barTextColor: 'hsl(215.4 16.3% 46.9%)',
  barSelectedColor: 'hsl(221.2 83.2% 53.3%)',
  barBg: 'hsl(0 0% 100%)',
  
  // Form colors
  inputBg: 'hsl(0 0% 100%)',
  inputBorder: 'hsl(214.3 31.8% 91.4%)',
  inputTextColor: 'hsl(222.2 84% 4.9%)',
  inputBorderRadius: 6,
});
