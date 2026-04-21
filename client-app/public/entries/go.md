# go

## Overview
- What is Go and why learn it?
- Key characteristics: simplicity, concurrency, performance
- Use cases: web services, microservices, CLI tools, cloud-native applications

go is a relatively new language created with the goal of combining the simplicity and quick development time of a language like python with the speed of more lower level languages. It's main selling feature is its ability to leverage modern computer architecture by intuitively leveraging multiple running cores. This lowers compile time and once mastered by the developer makes applications run extremely quickly. It's quickly becoming the standard language for startups and companies on the bleeding edge.

## Getting Started
- Installation and setup
- Your first "Hello, World" program
- Understanding `go.mod` and Go modules
- Basic project structure

## Core Language Fundamentals
### Variables and Types
- Variable declarations (`var`, `:=`, type inference)
- Basic types (int, string, bool, float)
- Zero values
- Type conversions

### Control Flow
- If/else statements
- Switch statements (with and without condition)
- For loops (the only loop in Go)
- Range loops

### Functions
- Function syntax
- Multiple return values
- Named return values
- Variadic functions
- Functions as first-class citizens

## Data Structures
### Arrays and Slices
- Arrays vs Slices
- Slice operations (append, copy, slicing)
- Slice internals (length, capacity)

### Maps
- Creating and using maps
- Checking for key existence
- Iterating over maps

### Structs
- Defining structs
- Struct methods (value vs pointer receivers)
- Embedding and composition

## Pointers and Memory
- Understanding pointers
- When to use pointers
- Nil pointers and safety

## Error Handling
- Go's error philosophy (no exceptions)
- Error interface
- Creating and returning errors
- Error wrapping (`fmt.Errorf`, `errors.Wrap`)
- Error checking patterns

## Interfaces
- Interface basics
- Implicit interface implementation
- Empty interface (`interface{}` / `any`)
- Type assertions and type switches
- Common interfaces (`io.Reader`, `io.Writer`, `error`)

## Concurrency (Go's Superpower)
### Goroutines
- What are goroutines?
- Starting goroutines
- Goroutine lifecycle

### Channels
- Channel basics (unbuffered vs buffered)
- Sending and receiving
- Channel directions
- Select statement
- Closing channels
- Range over channels

### Patterns
- Worker pools
- Fan-in/Fan-out
- Context for cancellation
- Mutexes and sync package

## Packages and Modules
- Creating packages
- Exported vs unexported (capitalization)
- Package organization
- Import paths
- Module versioning

## Standard Library Highlights
- `fmt` - formatting and printing
- `io` / `os` - file operations
- `net/http` - HTTP client and server
- `encoding/json` - JSON handling
- `strings` / `strconv` - string manipulation
- `time` - time operations
- `testing` - writing tests

## Testing
- Writing unit tests
- Table-driven tests
- Benchmarks
- Test coverage
- Example functions

## Best Practices
- Code organization
- Naming conventions
- Error handling patterns
- When to use pointers
- Documentation comments
- Idiomatic Go style

## Common Pitfalls
- Nil pointer dereferences
- Goroutine leaks
- Closing channels incorrectly
- Mutating slices during iteration
- Interface nil checks

## Next Steps
- Building a REST API
- Working with databases
- Creating CLI tools
- Building microservices
- Exploring popular libraries and frameworks

## Resources
- Official documentation
- Effective Go
- Go by Example
- Community resources
