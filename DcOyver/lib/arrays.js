Array.prototype.last = function () {
    return this[this.length - 1];
};

Array.prototype.chunk = function(size) {
    let result = [];
    for (let i = 0; i < this.length; i += size) {
      result.push(this.slice(i, i + size));
    }
    return result;
};
  
Array.prototype.shuffle = function () {
    let i = this.length;
    while (i) {
      let j = Math.floor(Math.random() * i);
      let t = this[--i];
      this[i] = this[j];
      this[j] = t;
    }
    return this;
};

Array.prototype.random = function() {
    return this[Math.floor(Math.random() * this.length)];
};
