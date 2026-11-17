import { courseFormat, type CourseFile, type SlideNode } from '../lib/course'

function node(id: string, parentId: string | null, title: string, content: string): SlideNode {
  return { id, parentId, title, content: content.trim() }
}

export const cppFoundation: CourseFile = {
  format: courseFormat,
  version: 1,
  id: 'cpp-foundation',
  title: 'C++ for Systems Programming',
  description: 'Video 1, sections 1–5. The language foundation through user-defined types. About 52 minutes of a 2-hour video.',
  nodes: [
    node(
      'cpp-intro',
      null,
      '1. Introduction to C++',
      `
About 5 minutes. Viewers should know what C++ is, why it is compiled, and that the language and the standard library are two different things.

This video teaches enough C++ to write an ordinary program. Later videos open the box: memory, ownership, object lifetime, performance, and concurrency. Do not preview those topics here.
`,
    ),
    node(
      'cpp-what-is',
      'cpp-intro',
      'What is C++?',
      `
C++ is a compiled, statically typed language for programs that need control over memory, layout, and speed.

Bjarne Stroustrup started it as “C with classes.” It is still a systems language: operating systems, databases, browsers, game engines, and embedded firmware are written in it. It is also a general-purpose language, which is why the same tools show up in ordinary application code.

A C++ program is source text. A compiler turns that text into machine code for a target, such as your laptop. The running program does not carry the source, and it does not ask an interpreter what \`+\` means.

> **Takeaway.** C++ is a language for programs that have to be fast and explicit about their resources. The compiler checks types and then emits native code.
`,
    ),
    node(
      'cpp-vs-c',
      'cpp-intro',
      'C vs C++',
      `
C++ grew from C. Most C is legal C++, and the machine model is the same: bytes, addresses, and functions. The difference is what the language will express for you.

| | C | C++ |
| --- | --- | --- |
| Data | Structs of bytes | Structs and classes with behavior |
| Reuse | Functions and macros | Functions, overloads, and templates |
| Library | A small standard library | Containers, strings, algorithms, streams |
| Cleanup | You call \`free\` yourself | Destructors run when an object ends |

You can still write C-style code in a \`.cpp\` file. The point of this video is the C++ way: \`std::string\` instead of a raw character buffer, \`std::vector\` instead of a hand-rolled array, and a class when data and operations belong together.

> **Takeaway.** C and C++ share a machine. C++ adds types, libraries, and a way to tie cleanup to an object’s lifetime. We use those additions. We do not re-explain the machine yet.
`,
    ),
    node(
      'cpp-compiled',
      'cpp-intro',
      'Compiled vs interpreted',
      `
An interpreted language reads the program as it runs. A compiled language translates the program before it runs.

\`\`\`text
source.cpp  →  compiler  →  object file  →  linker  →  program
\`\`\`

You edit \`main.cpp\`. The compiler parses it, checks the types, and writes an object file of machine code. The linker combines your object files with the standard library and produces the executable. Running \`./program\` executes that binary. There is no C++ runtime walking your source line by line.

Errors split in two. A type error or a missing declaration fails the build. A logic error, such as opening a file that is not there, happens when the program runs.

We will not open object files or the linker in this video. That is a later lecture. What matters now is the loop: change the source, compile, run.

\`\`\`bash
c++ -std=c++20 -Wall -Wextra -o program main.cpp
./program
\`\`\`

> **Takeaway.** Viewers compile a translation of the program, then run the result. The compiler is part of writing C++, not a separate course.
`,
    ),
    node(
      'cpp-systems',
      'cpp-intro',
      'Why C++ for systems programming',
      `
Systems code sits next to the hardware and next to other programs’ data. It has to be predictable.

C++ fits that work because:

- Values have a known size. An \`int\` is an integer, a \`Sensor\` is the bytes you declared, and a \`std::vector\` tells you it owns a growable buffer.
- You choose where data lives. Local variables live with the call. Objects you allocate live until you say otherwise. We name that choice later. Here, viewers only need to know the choice exists.
- Abstraction is optional. A class or a template does not force a runtime lookup unless you ask for one, as with a virtual function.
- The standard library covers the ordinary pieces: strings, dynamic arrays, maps, and files. You do not start from \`malloc\`.

“Suitable for systems” does not mean “write everything with pointers.” It means you can drop down when the layout matters, and stay up at \`std::vector\` when it does not.

> **Takeaway.** C++ is useful for systems work because cost and layout stay visible, while the standard library already supplies the everyday containers and I/O.
`,
    ),
    node(
      'cpp-language-library',
      'cpp-intro',
      'The language and the standard library',
      `
Two things ship together, and they are not the same thing.

The **language** is the grammar: types, functions, classes, templates, statements. The compiler implements it. \`int\`, \`if\`, \`class\`, and \`+\` are language.

The **standard library** is a large collection of types and functions written in that language. Headers such as \`<string>\`, \`<vector>\`, and \`<iostream>\` declare it. It lives in namespace \`std\`. \`std::string\`, \`std::vector\`, and \`std::cout\` are library, not extra syntax.

\`\`\`cpp
#include <string>
#include <vector>

int main() {
    std::vector<std::string> lines;
    lines.push_back("boot ok");
    return 0;
}
\`\`\`

\`int\`, \`main\`, and the braces are the language. \`std::vector\` and \`std::string\` are library types. This video teaches both, because an ordinary C++ program uses both on the first page.

> **Takeaway.** Learn the language so you can read any C++. Learn the library so you do not rebuild strings, arrays, and maps by hand.
`,
    ),

    node(
      'cpp-fundamentals',
      null,
      '2. Core language fundamentals',
      `
About 12 minutes. Assume the viewer already knows variables, \`if\`, and loops from some other language. Show the C++ names and the few rules that bite, then move on.
`,
    ),
    node(
      'cpp-types',
      'cpp-fundamentals',
      'Types',
      `
Every object has a type, and the type decides its size, its values, and which operations are legal. The compiler checks that before the program runs.

| Type | What it holds |
| --- | --- |
| \`bool\` | \`true\` or \`false\` |
| \`char\` | A character, stored as a small integer |
| \`int\` | A signed integer. Typical size is 32 bits |
| \`long\`, \`long long\` | Wider signed integers |
| \`float\`, \`double\` | Floating-point approximations |
| \`std::size_t\` | An unsigned size. Use it for counts and indexes |

\`\`\`cpp
int retries = 3;
double load = 0.75;
char grade = 'A';
bool ready = true;
\`\`\`

Prefer \`int\` for a count you compute, \`double\` for a measurement, and \`bool\` for a yes or no. Reach for \`long long\` when the value may not fit in 32 bits. Do not memorize every width. Remember that the type is a promise the compiler enforces.

> **Takeaway.** Pick the type that matches the value. The compiler will reject a program that treats a number as a string.
`,
    ),
    node(
      'cpp-signed',
      'cpp-fundamentals',
      'Signed, unsigned, and conversion',
      `
A signed integer can be negative. An unsigned integer cannot. \`int\` is signed. \`unsigned\` and \`std::size_t\` are not.

Unsigned wrap is defined: if an \`unsigned\` is 0 and you subtract 1, you get the maximum value, not \`-1\`. That surprise shows up in loops.

\`\`\`cpp
std::size_t n = 0;
// n - 1 is a huge number, not -1
\`\`\`

C++ will convert between numeric types. A smaller type widens in an expression. A conversion that can lose data, such as \`double\` to \`int\`, truncates toward zero. Write that conversion yourself so a reader sees it.

\`\`\`cpp
double reading = 3.9;
int whole = static_cast<int>(reading);  // 3
\`\`\`

\`static_cast<T>(value)\` is the ordinary cast. It asks for a conversion the language already knows. It does not reinterpret the bytes.

Mixing signed and unsigned in one comparison is a common bug. Keep a size in \`std::size_t\` and a difference that might be negative in a signed type.

> **Takeaway.** Unsigned means “never negative,” not “bigger int.” Cast on purpose with \`static_cast\`, and do not compare signed with unsigned by accident.
`,
    ),
    node(
      'cpp-const',
      'cpp-fundamentals',
      'const, constexpr, and operators',
      `
\`const\` means this name will not be used to modify the object. The compiler rejects an assignment through it.

\`\`\`cpp
const int max_retries = 5;
// max_retries = 6;   // error
\`\`\`

\`constexpr\` means the value is fixed when the program is compiled. Use it for a limit or a table size that the compiler must know.

\`\`\`cpp
constexpr int ports = 4;
\`\`\`

The operators are the ones a viewer already uses, with two C++ details worth saying out loud.

- \`=\` assigns. \`==\` compares.
- \`&&\` and \`||\` stop early. If the left side of \`&&\` is false, the right side is not evaluated.
- \`++n\` adds one, then yields the new value. \`n++\` yields the old value, then adds one. In a statement by itself they do the same thing.

> **Takeaway.** Mark a value \`const\` when it should not change. Mark it \`constexpr\` when the compiler needs the number in order to compile the program.
`,
    ),
    node(
      'cpp-scope',
      'cpp-fundamentals',
      'Scope, namespaces, and auto',
      `
A name is visible in the block where it is declared, from the declaration to the closing brace. A name in an inner block hides an outer one. Parameters are local to the function.

A namespace groups names so two libraries can both have a function called \`open\`. The standard library uses \`std\`.

\`\`\`cpp
#include <vector>

int main() {
    std::vector<int> samples;
    auto count = samples.size();  // std::size_t
}
\`\`\`

\`auto\` asks the compiler to deduce the type from the initializer. The variable still has one fixed type. \`auto\` is not a dynamic type. It is a way to avoid writing \`std::size_t\` or a long iterator type when the right side already shows it.

Write the type when it documents intent (\`int retries\`). Use \`auto\` when the type is noisy or obvious from the right-hand side.

\`using std::vector;\` brings one name into the current scope. \`using namespace std;\` brings all of them. Avoid the second one in a header. It makes every later name harder to read.

> **Takeaway.** A name lives in a scope and, often, a namespace. \`auto\` deduces a real type. It does not turn C++ into an untyped language.
`,
    ),
    node(
      'cpp-control',
      'cpp-fundamentals',
      'Control flow',
      `
Viewers already know branching and loops. Show the C++ forms once, including the range-based loop they will actually write.

\`\`\`cpp
if (load > 0.9) {
    status = "hot";
} else {
    status = "ok";
}

switch (code) {
    case 0: break;
    case 1: break;
    default: break;
}

for (int i = 0; i < 3; ++i) { }

while (tries < max_retries) { }

for (const auto& sample : samples) {
    // one element at a time
}
\`\`\`

\`break\` leaves the nearest loop or \`switch\`. \`continue\` skips to the next iteration. A \`switch\` does not leave a \`case\` on its own. Without \`break\`, execution falls into the next case.

The range-based \`for\` walks a container from beginning to end. Prefer it when you do not need the index.

> **Takeaway.** The control statements are ordinary. The one to start using immediately is \`for (const auto& item : container)\`.
`,
    ),

    node(
      'cpp-functions',
      null,
      '3. Functions and program structure',
      `
About 10 minutes. A program is a set of functions, with \`main\` as the one the operating system calls. Show how to declare a function, how arguments are passed, and how a header publishes a declaration.
`,
    ),
    node(
      'cpp-function-basics',
      'cpp-functions',
      'Declaring and defining functions',
      `
A declaration tells the compiler the name, the parameters, and the return type. A definition is the declaration plus the body. You can declare a function many times. You define it once.

\`\`\`cpp
int clamp(int value, int low, int high);   // declaration

int clamp(int value, int low, int high) {   // definition
    if (value < low) return low;
    if (value > high) return high;
    return value;
}
\`\`\`

Arguments are matched to parameters by position. \`return\` hands a value back and leaves the function. A function with return type \`void\` returns nothing.

Names declared inside the function, including parameters, die when the function returns. The caller keeps only the returned value, not the local variables.

\`main\` returns \`int\`. \`return 0;\` means the program succeeded. A nonzero value is a status the operating system can see.

> **Takeaway.** The declaration is the contract. The definition is the work. Locals belong to the call, not to the caller.
`,
    ),
    node(
      'cpp-passing',
      'cpp-functions',
      'How arguments are passed',
      `
Pass by value copies the argument. The function can change its parameter and the caller’s object stays the same. This is the right default for \`int\`, \`bool\`, and other small values.

Pass by reference uses \`&\`. The parameter is another name for the caller’s object. No copy is made. A non-const reference lets the function modify the caller. A \`const\` reference lets the function read a large object without copying it.

\`\`\`cpp
void reset(int& value) { value = 0; }

int length_of(const std::string& text) {
    return static_cast<int>(text.size());
}

void log(std::string message = "ok") { }
\`\`\`

A default argument fills in a parameter the caller omitted. Put defaults on the trailing parameters. The caller writes \`log()\` or \`log("disk full")\`.

Choose like this:

- Small, cheap values: pass by value.
- A large object the function only reads: \`const T&\`.
- An object the function must change: \`T&\`.

> **Takeaway.** Value means a copy. Reference means the caller’s object. Read large objects through \`const T&\`.
`,
    ),
    node(
      'cpp-overloads',
      'cpp-functions',
      'Overloading and inline',
      `
Two functions may share a name if their parameters differ. The compiler picks the one that matches the call. The return type alone is not enough to tell them apart.

\`\`\`cpp
void write(int code);
void write(const std::string& message);

write(404);
write("not found");
\`\`\`

This is why \`std::sort\` and many library functions feel like one tool. Several functions, one name, chosen from the arguments.

\`inline\` on a function means two practical things, and neither is a promise about speed. The definition may appear in more than one translation unit, which is why small functions often live in headers. The compiler may substitute the body at the call. It may also ignore that and call the function normally.

Say “the body is available at the call.” Do not open the optimizer.

> **Takeaway.** Overloading is several functions under one name, selected by the arguments. \`inline\` lets a small function live in a header. It is not a performance switch.
`,
    ),
    node(
      'cpp-headers',
      'cpp-functions',
      'Headers and program structure',
      `
A realistic program is more than one file. The header publishes the contract. The source file holds the definitions.

\`\`\`cpp
// clamp.hpp
#pragma once
int clamp(int value, int low, int high);
\`\`\`

\`\`\`cpp
// clamp.cpp
#include "clamp.hpp"

int clamp(int value, int low, int high) {
    if (value < low) return low;
    if (value > high) return high;
    return value;
}
\`\`\`

\`\`\`cpp
// main.cpp
#include "clamp.hpp"

int main() {
    return clamp(12, 0, 10);
}
\`\`\`

\`#include\` pastes a header into the file that includes it. \`#pragma once\` keeps that paste from defining the same name twice when headers include each other. Include the header that declares what you use. Include \`<string>\` for \`std::string\`, and your own \`"clamp.hpp"\` for \`clamp\`.

Angle brackets are for the standard library and other installed libraries. Quotes are for headers in your project.

> **Takeaway.** A header says what other files may call. A \`.cpp\` file says how it works. \`main\` is just the function the program starts in.
`,
    ),

    node(
      'cpp-strings',
      null,
      '4. Strings and basic data handling',
      `
About 10 minutes. Paths, commands, configuration, and input are text. Viewers should leave able to hold a string, compare it, and turn it into a number.
`,
    ),
    node(
      'cpp-c-string',
      'cpp-strings',
      'C strings and std::string',
      `
A C string is a pointer to a sequence of \`char\` that ends with a \`'\\0'\`. The language gives you that form because C did. You are responsible for the buffer’s size. A missing terminator or a short buffer is a bug.

\`std::string\` owns its characters. It knows its length, it grows, and it cleans itself up when the string dies. This is the type to use.

\`\`\`cpp
#include <string>

std::string name = "sensor";
std::string path = "/var/log/app.log";
\`\`\`

String literals in quotes are still C strings. Initializing a \`std::string\` from one copies the characters into the string. After that, work with the \`std::string\`.

\`std::string::size()\` returns the number of characters. \`empty()\` is true when the size is 0. You do not look for a trailing zero.

> **Takeaway.** A C string is a bare buffer. \`std::string\` owns its text. Ordinary code uses \`std::string\`.
`,
    ),
    node(
      'cpp-string-ops',
      'cpp-strings',
      'Building and comparing strings',
      `
\`+\` and \`+=\` concatenate. \`==\` and \`!=\` compare the characters, not the addresses. \`<\` orders them lexicographically, which is what you want for a sort of names and not always what you want for version numbers.

\`\`\`cpp
std::string dir = "/var/log";
std::string path = dir + "/app.log";

if (path == "/var/log/app.log") {
    // same characters
}
\`\`\`

A few member functions cover the everyday edits.

\`\`\`cpp
path.size();
path.empty();
path.substr(0, 8);          // "/var/log"
path.find("log");           // index, or npos
path.append(".1");
\`\`\`

\`find\` returns \`std::string::npos\` when the text is not there. Compare against \`npos\`, not against \`-1\`.

Pass a string you only read as \`const std::string&\`. Return a string by value. The caller receives its own string.

> **Takeaway.** Build text with \`+\`. Compare it with \`==\`. \`find\` returns \`npos\` when it fails, not a negative index.
`,
    ),
    node(
      'cpp-string-view',
      'cpp-strings',
      'std::string_view',
      `
\`std::string_view\` is a pointer and a length. It does not own the characters. It looks at text that already lives somewhere else: a \`std::string\`, or a string literal.

\`\`\`cpp
#include <string_view>

std::size_t width(std::string_view text) {
    return text.size();
}

std::string stored = "cpu";
width(stored);
width("cpu");
\`\`\`

Use it for a function parameter when the function only needs to read a slice of text and should accept both \`std::string\` and a literal. Do not store a \`string_view\` past the lifetime of the text it points at. A view of a temporary is a dangling view. We will treat lifetime properly in a later video. The rule for now is short: the view is a loan, not a copy.

\`\`\`cpp
// The view must not outlive the string it refers to.
std::string_view loan = stored;
\`\`\`

> **Takeaway.** \`string_view\` reads text without copying it. The text has to stay alive for as long as the view does.
`,
    ),
    node(
      'cpp-convert',
      'cpp-strings',
      'Characters and conversion',
      `
A \`char\` is a small integer that you usually mean as a character. \`'A'\` is a \`char\`. \`"A"\` is a string. The header \`<cctype>\` has the predicates, and they take an \`unsigned char\` value so a negative \`char\` is not a surprise.

\`\`\`cpp
#include <cctype>

bool digit = std::isdigit(static_cast<unsigned char>('7'));
\`\`\`

The library converts between text and numbers. \`std::to_string\` makes text. \`std::stoi\`, \`std::stol\`, and \`std::stod\` parse text. They throw if the text is not a number. Catching that exception comes later. For now, know that a bad string is an error, not a zero you should ignore.

\`\`\`cpp
#include <string>

std::string label = std::to_string(404);
int code = std::stoi("404");
double load = std::stod("0.75");
\`\`\`

This is the text path a systems program uses for a port number in a config file, a pid in a command, or a reading in a log line.

> **Takeaway.** \`'A'\` is one character. \`"A"\` is text. \`to_string\` and \`stoi\` / \`stod\` cross between the two, and a string that is not a number is an error.
`,
    ),

    node(
      'cpp-types-oop',
      null,
      '5. User-defined types and OOP',
      `
About 15 minutes. A user-defined type bundles data and the operations on it. Introduce constructors and virtual functions only far enough to read ordinary classes. Object lifetime, copying, and ownership are later videos.
`,
    ),
    node(
      'cpp-struct-class',
      'cpp-types-oop',
      'struct, class, and access',
      `
\`struct\` and \`class\` both define a type. The only language difference is the default access. A \`struct\` starts public. A \`class\` starts private.

Use a \`struct\` for a plain group of data. Use a \`class\` when some data should stay private and callers should go through functions.

\`\`\`cpp
struct Reading {
    double value;
    bool valid;
};

class LogEntry {
public:
    void set_level(const std::string& level) { level_ = level; }
    const std::string& level() const { return level_; }

private:
    std::string level_;
};
\`\`\`

\`public\` is the surface other code may use. \`private\` is the data the type maintains itself. A trailing underscore on \`level_\` is a convention, not a rule, so a member is easy to tell from a parameter.

A member function is called on an object: \`entry.set_level("error")\`. A member function marked \`const\` promises not to change the object. Read accessors should be \`const\`.

> **Takeaway.** \`struct\` for open data, \`class\` when there is a private representation. \`public\` is the API. \`private\` is the rest.
`,
    ),
    node(
      'cpp-constructors',
      'cpp-types-oop',
      'Constructors, destructors, and this',
      `
A constructor runs when an object is created. It puts the object into a valid state. It has the type’s name and no return type. A destructor runs when the object’s lifetime ends. Its name is \`~\` plus the type. We use destructors seriously when we talk about resources. Here, know that it exists and that you rarely write one for a type that only holds \`std::string\` and numbers.

\`\`\`cpp
class LogEntry {
public:
    LogEntry(const std::string& level, const std::string& message)
        : level_(level), message_(message) {}

    const std::string& level() const { return level_; }

private:
    std::string level_;
    std::string message_;
};
\`\`\`

The list after the colon is the member initializer list. Members are initialized there, before the constructor body runs. Prefer that list to assigning members inside the body.

\`this\` is a pointer to the object the member function was called on. \`this->level_\` and \`level_\` are the same member. Write \`this->\` when a parameter hides the member’s name. Otherwise leave it off.

> **Takeaway.** The constructor builds a valid object. Initialize members in the initializer list. \`this\` points at the object you called the function on.
`,
    ),
    node(
      'cpp-static-enum',
      'cpp-types-oop',
      'Static members and enumerations',
      `
A \`static\` data member belongs to the type, not to one object. A \`static\` member function can be called without an object. Use them for a counter or a function that does not need an instance.

\`\`\`cpp
class LogEntry {
public:
    static int created() { return created_; }
private:
    static int created_;
};
\`\`\`

An \`enum class\` is a scoped set of named values. It does not mix with integers unless you cast. That is what you want for a level, a state, or a file mode.

\`\`\`cpp
enum class Level { info, warning, error };

Level current = Level::error;
if (current == Level::error) {
    // not an int, and not some other enum's "error"
}
\`\`\`

A plain \`enum\` converts to an integer and dumps its names into the surrounding scope. Prefer \`enum class\` unless you are matching an old C API.

> **Takeaway.** \`static\` is one value shared by the type. \`enum class\` is a closed set of names that will not silently become an \`int\`.
`,
    ),
    node(
      'cpp-composition',
      'cpp-types-oop',
      'Composition',
      `
Composition means a type has another type as a member. The outer object contains the inner one. When the outer object is created, the member is created. When the outer object ends, the member ends.

\`\`\`cpp
struct Timestamp {
    int hour;
    int minute;
    int second;
};

class LogEntry {
public:
    LogEntry(Timestamp when, const std::string& message)
        : when_(when), message_(message) {}

private:
    Timestamp when_;
    std::string message_;
};
\`\`\`

This is the relationship to reach for first. A log entry has a time and a message. A server has a config. A config has a port. “Has a” is composition.

You do not need inheritance to build that. Most types in a program are composed, not derived.

> **Takeaway.** “Has a” is a member. Build types by putting smaller types inside them.
`,
    ),
    node(
      'cpp-inheritance',
      'cpp-types-oop',
      'Inheritance and virtual functions',
      `
Inheritance means a type is a more specific kind of another type. The derived class gets the base class’s public members and can add its own. Use it when you truly have a substitutable kind, not merely to reuse a few fields.

\`\`\`cpp
class Report {
public:
    virtual ~Report() = default;
    virtual std::string title() const { return "report"; }
};

class ErrorReport : public Report {
public:
    std::string title() const override { return "error report"; }
};
\`\`\`

A function marked \`virtual\` in the base can be overridden in the derived class. The call uses the dynamic type of the object. \`ErrorReport\`’s \`title\` runs even when the function is called through a \`Report&\`. \`override\` asks the compiler to check that you really replaced a virtual function.

The virtual destructor matters once a derived object is destroyed through a base pointer. We are not studying object lifetime in this video. Write the virtual destructor on a polymorphic base so the example is not a trap, and leave the explanation for the lifetime lecture.

A \`Report&\` can refer to an \`ErrorReport\`. A value of type \`Report\` cannot hold an \`ErrorReport\` without slicing it down to the base. Pass polymorphic objects by reference or pointer.

> **Takeaway.** Inheritance is “is a,” and a virtual function lets the derived class replace the base behavior. Prefer composition until you need that substitution. Copying, lifetime, and ownership of these objects come later.
`,
    ),
  ],
}
