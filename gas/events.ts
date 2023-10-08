import Application from './application';

const Events = {
  onOpen(e: any) {
    Application.crateMenu();
  },
};

export default Events;
