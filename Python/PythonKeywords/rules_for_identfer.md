# Rules for Python Identifiers

An **identifier** is a name used to identify a variable, function, class, module, or other object.

## Rules

1. **Must start with a letter (a–z, A–Z) or an underscore (`_`)**
   - ✅ `age`, `_age`, `_value`
   - ❌ `123abc`, `1name`

2. **Can contain letters, digits (0–9), and underscores — no other characters**
   - ✅ `abc123`, `my_var`, `value1`
   - ❌ `my-var`, `my var`, `my@var`

3. **Case-sensitive** — `Name`, `name`, and `NAME` are three different identifiers
   - ✅ `age = 10` and `Age = 20` are separate variables

4. **Cannot be a Python keyword**
   - ❌ `for`, `while`, `if`, `class`, `return`, `True`, `False`, `None`

5. **No spaces allowed**
   - ✅ `first_name`
   - ❌ `first name`

6. **No length limit** (but keep them meaningful and readable)

7. **Single underscore `_`** is a valid identifier (commonly used as a throwaway variable)
   - ✅ `_ = 12`

8. **Double leading underscore `__`** has special meaning in classes (name mangling)

## Examples from Lab-006

```python
age = 65          # valid — starts with a letter
_age = 65         # valid — starts with underscore
_ = 12            # valid — underscore alone is a legal identifier
abc123 = "abc123" # valid — letter first, then digits
name = "Pramod"   # valid — descriptive variable name

# 123abc = 90     # INVALID — starts with a digit
# my-var = 5      # INVALID — hyphen not allowed
# for = 1         # INVALID — reserved keyword
```

## Naming Conventions (PEP 8)

| Use case        | Convention          | Example          |
|-----------------|---------------------|------------------|
| Variables       | `snake_case`        | `first_name`     |
| Functions       | `snake_case`        | `get_value()`    |
| Constants       | `UPPER_SNAKE_CASE`  | `MAX_SIZE`       |
| Classes         | `PascalCase`        | `MyClass`        |
| Private members | `_leading_underscore` | `_helper`      |
