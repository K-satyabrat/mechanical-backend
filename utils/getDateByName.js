const getDateByName= (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    //in formate Today 09:00 AM 
    return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    //in formate Yesterday 09:00 AM
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
 // in formate 2 days ago 09:00 AM
    const timeDiff = Math.abs(today - date);
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    return `${daysDiff} ago`;
  }
}

module.exports = getDateByName;
 