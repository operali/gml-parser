const delay = async (ns: number) => {
  return new Promise(res => {
    setTimeout(() => {
      res();
    }, ns * 1000);
  })
}


async function foo() {
  // test of es6
  let ma = {
    a: 3,
    b: 3
  };
  let mb = {
    b: 4,
    c: 5
  }
  let mc = new Map();
  mc.set('d', 6);
  if ({
    ...ma,
    ...mb
  }.b == 4 && mc.get('d') == 6 && [1, 2].includes(2)) {
    await delay(1);
    console.log('foo from util/index');
  }

  return 'bar';
}

const marginLeft = (str: string, n: number) => {
  let lines = str.split('\n');
  let leftSpace = new Array<string>(n).fill(' ').join('');
  let newStr = lines.join('\n' + leftSpace);
  newStr = leftSpace + newStr;
  return newStr;
}

const isBlank = (str: string) => {
  return str.trim() == "";
}

function bSearch(arr: any[], d: any, gt: (d: any, arrItem: any) => boolean): number {
  let left = 0;
  let right = arr.length;
  if (arr.length == 0) {
    throw `bSearch in empty `;
  }
  while (true) {
    let mid = (left + right) >> 1;
    let v = arr[mid];
    if (gt(d, v)) {
      left = mid;
      if (right - left == 1) {
        return right;
      }
    } else {
      right = mid;
      if (left == right) {
        break;
      }
    }
  }
  if (left == 0) {
    if (gt(arr[0], d)) {
      return -1;
    }
  }
  return left;
}

export {
  foo,
  delay,
  marginLeft,
  isBlank,
  bSearch
}
