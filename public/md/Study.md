# Javascript for Web Developers 
책보고 기억에 남게 정리

# 2020 04 13
ECMAscript는 웹에 쓰이는 스크립트언어를 표준화하기 위해 정의한것. 유러피안 컴퓨터 매뉴팩쳐러 어쏘시에이션 <br>
각 브라우저마다 에크마스크립트를 지키려하지만 각각 쓰는 스크립트언어가 달라 지원안되는 경우 있음. <br>
자바스크립트는 모질라의 전신, 넷스케이프에서 개발함. 자바의 인기를 환승하 위해 이름 지음;<br>

var는 지역변수였음! -> 스코프 레벨 디자인이 달라 헷갈릴수있음

DOM은 다큐먼트 오브젝트 모델로,DHTML이 생기면서 각 브라우저마다 달라지는 형식을 고정한 것.<br>
undefined 와 null은 조건 검사시 같은걸로 나오나, NaN과 NaN은 서로 다르게 나온다. 그래서 isNan() 함수를 사용해야함.<br>
보통 null은 객체에서 쓰이는 것으로, 객체 초기화시에 사용하면된다.<brNumber()함수는 숫자 변형을 해주나, pasrseInt()와 조금 다른부분이 있다.<br>
숫자는 32비트로 계산, 음수는 2의보수로 계산<br>
\~을 사용한경우 1의보수로 계산<br>
8의진수 0을 앞에 붙이면 되고, 8이상 숫자를 사용시 10진수로 자동 인식<br>
16진수 0x를 사용<br>
루프 내에서 사용하는 i 변수는 index 가 아니라 iterator 였다.<br>
var키워드 없이 변수 선언시 명시적으 전역변수가 되지만, 예기치않은 버그가 나올 수 있으니 권장하지 않음.<br>
for in 문에서 객체가 null, undefined이면 ECMAscript 5 이전에는 에러가 났음. 이후엔 루프를 실행하지않게 바뀜.<br>
labeling 하는 것이 루프문 break, continue에 연결하여 조정가능<br>
ex)<br>

```javascript
fisrt:for(\~){<br>
  second:for(\~){<br>
    break first;<br>
  }<br>
}<br>
```
레이블 명시가 없으면 break 시 second 루프마 벗어나지만, first로 명시할 경우 first 의 루프를 벗어나게됨.<br>
continue는 자바스크립트에서 별도 실행 컨텍스트를 생성하여 성능에 무리를 주게되어, 잦은 사용은 권장되지 않음.<br>
switch 문은 동일/비동일 검사만 하므로 타입 검사는 하지 않음 .<br>
매개변수 관련 ECMAscript 특이 사항<br>
```function example(){}```

매개변수가 없어도 사용이 가능함.

```javascript
function example(){
	arguments.length // 매개변수 갯수 
	arguments[0] // 첫 매개변수 값 
}
```

특이한 점은 

```javascript
function example(num1,num2){
	arguments[1] = 10;
	return num1 + num2;
}
// num1 = 20, num2= 30 , 결과 : 30
```

같은 메모리를 공유하지 않지만, 아규먼트를 직접 수정하면 명시된 매개변수의 값도 변한다는 점.

오버로딩이 없어서 제일 마지막에 쓴 함수로 사용됨.

함수 매개변수에 참조값을 넣지 못함. 이는 콜바이 레퍼런스가 안된다는뜻.

객체의 경우,  heap단계에 저장되는 전역 객체를 참조하는 식이므로, 객체를 매개변수를 놓는다고해서 콜바이 래퍼런스가 되는것은 아니다. 값이 전달되는 것 즉, 포인터값이 매개변수가 된것.

실행컨텍스트는 흔히 지역변수를 나누는 분기점을 이야기하는듯. 쉬운예로 window 자체가 전역컨텍스트이고 함수 하나 가 지역 컨텍스트이다. 이 사이에는 스코프 체인이라고 해서 선형적인 연결이있는데, 보통 지역변수 전역변수의 사용법에 연관. 

예외 구문은 try-catch 의 catch 블록과 with 문. 이들은 이전 변수객체를 추가함.

자스에는 블록 레벨이 없어서, var 사용시 내부 컨텍스트에서 선언되도 외부 컨텍스트에서 호출이됨. 하지만 외부컨텍스트의 또다른 내부컨텍스트 내에서는 사용이 안됨.

컨텍스트는 크게 전역컨텍스트와 함수컨텍스트로 나뉘고 스코프체인은 이것들에서만 적용됨.

자스에선 웹브라우저가 가비지컬렉션을 작동하여 메모리 정리를 해줌. 

전역 변수나 전역 객체만 메모리 관리를 해주면 문제없음.

자스의 .length는 write/read 둘다 가능!!!!!

php의 array 자동 추가 구문 array[] = newData;

는 js에서 array[array.length] = newData; 로 쓰면 된다!

물론 push 메서드도 있음. array.push(newData);

정규식 리터럴로 선언시 한번 test하면 해당 문자열 끝까지 조사할때까지 돌아오지않았으나,

ECMAScript 5 에서는 리터럴도 생성자를 호출하게 바뀜.

```javascript
var re = /cat/g;

var reg = new RegExp("cat","g");
```

함수는 하나의 객체로 봄. 함수선언과 함수표현식의 차이가 있는데,

```javascript
console.log(test1()); // 결과 : yes
console.log(test2()); // 에러

function test1(){
	 return "yes";
}
var test2 = function(){
	return "NO";
}
```

자스에서는 함수선언시 선언을 미리 찾은후에 올려서(hoist) 실행하여 test1은 정상 작동하지만, 표현식은 그렇지않음..

애매한 this 놀이에는 직접 명시와 .apply .call로 바로 this 변경하는 법이 있다. 또한 bind를 이용하여 특정 함수에 this를 고정하는 방법도 있다.

Number()와 Boolean()은 문제가 있어서 사용을 권장하지 않는다.

js의 String()의 length는 글자의 바이트수에 상관없이 한글자가 1length를 가짐.

스트링의 정규식 메소드를 이용한 방법 중 특수문자 사용시 유용한것

```javascript
var string = 'cat,bat,fat';
var newString = string.replace(/(.at)/g,"new $1");
console.log(newString);
// 결과 : new cat,new bat,new fat
```

```javascript
var callbackString = string.replace(/(.at)/g,function(pos,match){
    console.log("match text : "+ match+ ", pos : "+pos);
    return "new " + match;
})

console.log(callbackString);

// 결과
// match text : cat, pos : cat
// match text : bat, pos : bat
// match text : fat, pos : fat
// new cat,new bat,new fat
```

.replace의 콜백함수의 매개변수가 바뀔수도 있을거같음. 책이랑 좀다른데.

객체 의 프로퍼티의 속성을 바꾸는 메소드는  Object.defineProperty(objectName,propertyname,{...})

이며 객체에는 configurable enumerable writeable value 를 프로퍼티로 사용하여 값을 정할수있음.



다른 객체지향프로그래밍의 클래스와 비슷하게 짜는경우

```javascript
// 팩토리 패턴
function createPerson(name,age,job){
    var o = new Object();
    o.name = name;
    o.age = age;
    o.job = job;
    o.sayName = function(){
        console.log(this.name);
    }
    return o;
}

// 생성자 패턴
function Person(name,age,job){
    this.name = name;
    this.age = age;
    this.job = job;
    this.sayName = function(){
        console.log(this.name);
    }
}

//prototype 패턴
function People(){}
People.prototype.name = "Name";
People.prototype.age = "Age";
People.prototype.job = "Job";
People.prototype.sayName = function(){
    console.log(this.name);
}

var person1 = createPerson("Name1","Age1","Job1");
person1.sayName();
var person2 = new Person("Name2","Age2","Job2");
person2.sayName();
var person3 = new People();
person3.sayName();
var person4 = new People("Name3","Age3","Job3");
person4.sayName();
console.log(person4.name);

// 결과
// Name1
// Name2
// Name
// Name
// Name
```



<h1>2020.04.23</h1>

재귀함수 이용법

```javascript
function factorial(num){
	if(num<=1){
		return 1;
	} else {
		return num * arguments.callee(num-1);
	}
}

var factorial = (function f(num){
	if(num<=1){
		return 1;
	} else {
		return num * f(num-1);
	}
});
```

함수 속에서 직접 호출하면, 함수 복제 시 문제가 생길수 있다. 
arguments.callee 는 호출하는 함수에 포인터를 두므로, 어떠한 함수로 복제되도 작동한다.

함수 선언의 방법은 두가지로

```javascript
console.log(f(10)); // 10
console.log(g(20)); // error
// 클래식 함수 선언
function f(n){
	 return n;
} 

// 함수 표현식
var g = function(n){
	return n;
};
```

주의점은 자바스크립트 인터프리터는 function 키워드를 먼저 찾아 호이스트 하여 호출하기 때문에, 순서에 상관이 없지만, 함수 표현식의 경우, 다른 표현식과 같아서 호출전에 할당이 되어야합니다.



함수표현식의 사용되는 익명함수(람다함수)는 클로저와 같다고 생각할 수 있으나, 스코프체인을 비교해보면 다른 것임을 알 수 있다.

```javascript
function createComparisonFunction(property){
	return function(object1,object2){
		var value1 = object1[property];
		var value2 = object2[property];
		
		if(value1 < value2){
			return -1;
		} else if(value1 > value2){
			return 1;
		} else {
			return 0;
		}
	};
}

var compares = createComparisonFunction('name');
var result = compares({name:"Minsoo"},{name:"Chulsoo"});
compares = null;
```

해당 내부 익명함수는 내부함수이지만 외부 함수의 변수에 접근이 가능하다는 점이 다르다. 또한 스코프체인 새로 생성되어, 외부 함수의 실행이 끝남에도 외부함수의 객체는 파괴되지 않으며, 내부함수의 실행이 끝날 때까지 기다린다.



스코프체인의 문제점이 있는데 클로저는 항상 외부함수의 변수에 마지막값만 반환한다.

```javascript
function ex(num){
	var result = [];
	for(let i = 0 ; i < num; i++){
		result[i] = (function(newI){
			return function(){
				 return newI;
			};
		})(i);
	}
	return result;
}
```

그래서 클로저 내에서 익명함수를 정의하고 즉시 호출하면 고유한 값을 newI가 반환하므로, 상관이 없어짐.



<h1>2020 06 03</h1>

클로저는 은닉화에 도움이 된다. 이는 함수내의 함수인 클로저가 함수 내의 지역변수를 참조하여 반환하므로, 해당 함수의 지역변수를 파라미터로 지정하지 않는 이상, 이를 외부에서 접근할 방법이 없다. 

이하 삽질한 내용 정리

이전부터 시도하던 반복문 내 디비 호출이후 렌더링에 대해 여러 방법을 시도했다. (promise.then... reduce.. )

그중에 갑자기 되기 시작한 기본 async & await를 통해 함수로 호출하는 방법. 

```javascript
var array = [0,1,2,3,4,5,6,7,8,9];

exec(array);

async function exec(array){
  for(let i of array){
  	await loopTimeout(i);
  }
  console.log('finish');
}

function loopTimeout(i){
  return new Promise((resolve)=> {
    setTimeout(()=>{
      console.log(i);
      resolve();  
    },1000);
  });
}


/* result:
0
...
9
finish
*/
```



아주 동기적으로 작동을 잘한다! await를 걸어준 함수를 순차적으로 실행후, 마지막 로그를 찍게 된다. 

디비를 루프로 부르고 싶을때 이제 이렇게 호출하면 될거같다.

함수를 따로 선언하지 않고, 바로 호출하는 방식으로는 



```javascript
var array = [0,1,2,3,4,5,6,7,8,9];

(async(k)=>{
    for(let i of k){
        await ((j)=>{
            return new Promise((resolve)=> {
                setTimeout(()=>{
                    console.log(j);
                    resolve();  
                },1000);
                });
        })(i);
    }
    console.log('finish');
    
})(array);

/* result:
0
...
9
finish
*/
```

해결이 되서 만족스럽다.





