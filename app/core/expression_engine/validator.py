import ast
from typing import List

from pydantic import BaseModel


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    referenced_columns: List[str]
    referenced_operators: List[str]


ALLOWED_COLUMNS = {"open", "high", "low", "close", "volume", "return"}
ALLOWED_OPERATORS = {"ts_mean", "ts_std", "ts_rank", "zscore", "momentum", "delta", "delay", "rank"}


def _extract_static_int(node) -> int | None:
    """
    Extract a static integer value from an AST node if it represents an integer constant or unary operation on one.
    """
    if isinstance(node, ast.Constant):
        if isinstance(node.value, int):
            return node.value
    elif isinstance(node, ast.UnaryOp):
        if isinstance(node.op, ast.USub):
            operand_val = _extract_static_int(node.operand)
            if operand_val is not None:
                return -operand_val
        elif isinstance(node.op, ast.UAdd):
            return _extract_static_int(node.operand)
    return None


class ASTValidator(ast.NodeVisitor):
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.referenced_columns = set()
        self.referenced_operators = set()

    def visit_Name(self, node: ast.Name):
        # Reject dunder names
        if "__" in node.id:
            self.errors.append(f"Dunder names are strictly forbidden: {node.id}")
            return

        # Check if the name is an allowed column
        if node.id in ALLOWED_COLUMNS:
            self.referenced_columns.add(node.id)
        elif node.id in ALLOWED_OPERATORS:
            # Operator passed as variable (not called). This is generally fine but let's record it.
            self.referenced_operators.add(node.id)
        else:
            self.errors.append(f"Forbidden variable or name reference: {node.id}")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # The call must be direct, e.g. f(x). Attributes like obj.method() are rejected by visit_Attribute.
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            if func_name in ALLOWED_OPERATORS:
                self.referenced_operators.add(func_name)
                # Statically check operator arguments
                if func_name != "rank":
                    if len(node.args) != 2:
                        self.errors.append(
                            f"Operator {func_name} expects exactly 2 arguments, got {len(node.args)}"
                        )
                    else:
                        window_val = _extract_static_int(node.args[1])
                        if window_val is None:
                            self.errors.append(
                                f"Window size for {func_name} must be a static positive integer"
                            )
                        elif window_val <= 0:
                            self.errors.append(
                                f"Window size for {func_name} must be greater than zero, got {window_val}"
                            )
            else:
                self.errors.append(f"Forbidden or unknown function call: {func_name}")
        else:
            self.errors.append("Indirect or dynamic function calls are forbidden")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        self.errors.append(f"Attribute access is forbidden: .{node.attr}")
        self.generic_visit(node)

    def visit_Subscript(self, node: ast.Subscript):
        self.errors.append("Subscript/index access is forbidden")
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        self.errors.append("Assignments are forbidden")
        self.generic_visit(node)

    def visit_AnnAssign(self, node: ast.AnnAssign):
        self.errors.append("Annotated assignments are forbidden")
        self.generic_visit(node)

    def visit_AugAssign(self, node: ast.AugAssign):
        self.errors.append("Augmented assignments are forbidden")
        self.generic_visit(node)

    def visit_Import(self, node: ast.Import):
        self.errors.append("Imports are forbidden")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        self.errors.append("Imports are forbidden")
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.errors.append("Function definitions are forbidden")
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self.errors.append("Async function definitions are forbidden")
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        self.errors.append("Class definitions are forbidden")
        self.generic_visit(node)

    def visit_Lambda(self, node: ast.Lambda):
        self.errors.append("Lambda expressions are forbidden")
        self.generic_visit(node)

    def visit_ListComp(self, node: ast.ListComp):
        self.errors.append("List comprehensions are forbidden")
        self.generic_visit(node)

    def visit_SetComp(self, node: ast.SetComp):
        self.errors.append("Set comprehensions are forbidden")
        self.generic_visit(node)

    def visit_DictComp(self, node: ast.DictComp):
        self.errors.append("Dict comprehensions are forbidden")
        self.generic_visit(node)

    def visit_GeneratorExp(self, node: ast.GeneratorExp):
        self.errors.append("Generator expressions are forbidden")
        self.generic_visit(node)

    def generic_visit(self, node):
        # We also reject other node types that shouldn't be in simple mathematical formulas
        forbidden_nodes = (
            ast.With,
            ast.AsyncWith,
            ast.For,
            ast.AsyncFor,
            ast.While,
            ast.If,
            ast.Try,
            ast.ExceptHandler,
            ast.Raise,
            ast.Assert,
            ast.Delete,
            ast.Global,
            ast.Nonlocal,
            ast.Return,
            ast.Yield,
            ast.YieldFrom,
        )
        if isinstance(node, forbidden_nodes):
            self.errors.append(
                f"Control flow or statement type '{type(node).__name__}' is forbidden"
            )
        super().generic_visit(node)


def validate_expression(formula: str) -> ValidationResult:
    """
    Parse a formula string using python AST (eval mode), check for safety,
    and returns a structured validation result.
    """
    errors = []
    warnings = []

    if not formula or not formula.strip():
        return ValidationResult(
            is_valid=False,
            errors=["Formula cannot be empty"],
            warnings=[],
            referenced_columns=[],
            referenced_operators=[],
        )

    try:
        # Parse in 'eval' mode to ensure only expressions are parsed
        tree = ast.parse(formula.strip(), mode="eval")
    except SyntaxError as e:
        return ValidationResult(
            is_valid=False,
            errors=[f"Syntax error in formula: {str(e)}"],
            warnings=[],
            referenced_columns=[],
            referenced_operators=[],
        )

    validator = ASTValidator()
    validator.visit(tree)

    # Check if there were any errors found during AST traversal
    errors.extend(validator.errors)
    warnings.extend(validator.warnings)

    is_valid = len(errors) == 0

    return ValidationResult(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
        referenced_columns=sorted(validator.referenced_columns),
        referenced_operators=sorted(validator.referenced_operators),
    )
