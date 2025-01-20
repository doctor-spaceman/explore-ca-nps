export const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay);
  }
}

export const formatTimestamp = (timestamp) => {
  const msTimestamp = timestamp * 1000;
  const dateObj = new Date(msTimestamp)
  const dateFormat = dateObj.toLocaleString('en-US', {month: 'long', day: 'numeric'});
  return dateFormat;
}

export const setLocalStorageWithExpiry = (key, value, ttl) => {
  const now = new Date();

  // `item` is an object which contains the original value
  // as well as the time when it's supposed to expire
  const item = {
    value: value,
    expiry: now.getTime() + ttl
  };
  localStorage.setItem(key, JSON.stringify(item));
}

export const getLocalStorageWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  
  // if the item doesn't exist, return null
  if ( !itemStr ) return null;

  // compare the expiry time of the item with the current time
  const item = JSON.parse(itemStr);
  const now = new Date();

  if ( now.getTime() > item.expiry ) {
    // If the item is expired, delete the item from storage
    // and return null
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
}

export const isMobile = () => {
  return window.innerWidth < 768;
}