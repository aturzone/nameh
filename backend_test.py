#!/usr/bin/env python3
"""
Nameh.me Backend Infrastructure Test Suite
Tests configuration files, Python code structure, and API endpoints (when available)
"""

import os
import sys
import yaml
import toml
import importlib.util
from pathlib import Path

class NamehInfrastructureTest:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.issues = []
        
    def run_test(self, name, test_func):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                print(f"✅ Passed")
                return True
            else:
                print(f"❌ Failed")
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.issues.append(f"{name}: {str(e)}")
            return False
    
    def test_docker_compose_syntax(self):
        """Test Docker Compose YAML syntax"""
        try:
            with open('/app/docker-compose.yml', 'r') as f:
                yaml.safe_load(f)
            with open('/app/docker-compose.override.yml', 'r') as f:
                yaml.safe_load(f)
            return True
        except Exception as e:
            self.issues.append(f"Docker Compose YAML syntax error: {e}")
            return False
    
    def test_stalwart_config_syntax(self):
        """Test Stalwart TOML configuration syntax"""
        try:
            with open('/app/infrastructure/stalwart/config.toml', 'r') as f:
                toml.load(f)
            return True
        except Exception as e:
            self.issues.append(f"Stalwart TOML syntax error: {e}")
            return False
    
    def test_traefik_config_syntax(self):
        """Test Traefik YAML configuration syntax"""
        try:
            with open('/app/infrastructure/traefik/traefik.yml', 'r') as f:
                yaml.safe_load(f)
            with open('/app/infrastructure/traefik/dynamic/default.yml', 'r') as f:
                yaml.safe_load(f)
            return True
        except Exception as e:
            self.issues.append(f"Traefik YAML syntax error: {e}")
            return False
    
    def test_backend_python_imports(self):
        """Test Python backend module imports"""
        backend_modules = [
            'app.main',
            'app.config',
            'app.database', 
            'app.models.user',
            'app.routes.health',
            'app.routes.auth',
            'app.routes.users',
            'app.routes.mail',
            'app.services.stalwart',
            'app.utils.security'
        ]
        
        # Add backend to Python path
        sys.path.insert(0, '/app/backend')
        
        failed_imports = []
        for module in backend_modules:
            try:
                __import__(module)
            except ImportError as e:
                failed_imports.append(f"{module}: {e}")
            except Exception:
                # Expected for database connection issues
                pass
        
        if failed_imports:
            self.issues.extend(failed_imports)
            return False
        return True
    
    def test_environment_consistency(self):
        """Test .env and .env.example consistency"""
        try:
            import re
            
            with open('/app/.env', 'r') as f:
                env_content = f.read()
            with open('/app/.env.example', 'r') as f:
                env_example_content = f.read()
            
            env_vars = set(re.findall(r'^([A-Z_]+)=', env_content, re.MULTILINE))
            env_example_vars = set(re.findall(r'^([A-Z_]+)=', env_example_content, re.MULTILINE))
            
            missing_in_env = env_example_vars - env_vars
            missing_in_example = env_vars - env_example_vars
            
            if missing_in_env or missing_in_example:
                self.issues.append(f"Environment variable mismatch - missing in .env: {missing_in_env}, missing in .env.example: {missing_in_example}")
                return False
            return True
        except Exception as e:
            self.issues.append(f"Environment consistency check failed: {e}")
            return False
    
    def test_service_dependencies(self):
        """Test Docker Compose service dependencies"""
        try:
            with open('/app/docker-compose.yml', 'r') as f:
                compose_data = yaml.safe_load(f)
            
            services = compose_data.get('services', {})
            dependency_issues = []
            
            for service_name, service_config in services.items():
                depends_on = service_config.get('depends_on', {})
                if isinstance(depends_on, dict):
                    for dep in depends_on.keys():
                        if dep not in services:
                            dependency_issues.append(f"{service_name} depends on missing service {dep}")
                elif isinstance(depends_on, list):
                    for dep in depends_on:
                        if dep not in services:
                            dependency_issues.append(f"{service_name} depends on missing service {dep}")
            
            if dependency_issues:
                self.issues.extend(dependency_issues)
                return False
            return True
        except Exception as e:
            self.issues.append(f"Service dependency check failed: {e}")
            return False
    
    def test_required_files_exist(self):
        """Test that all required files exist"""
        required_files = [
            '/app/docker-compose.yml',
            '/app/docker-compose.override.yml',
            '/app/.env',
            '/app/.env.example',
            '/app/infrastructure/stalwart/config.toml',
            '/app/infrastructure/postgres/init.sql',
            '/app/infrastructure/redis/redis.conf',
            '/app/infrastructure/minio/init.sh',
            '/app/infrastructure/traefik/traefik.yml',
            '/app/infrastructure/traefik/dynamic/default.yml',
            '/app/backend/Dockerfile',
            '/app/backend/requirements.txt',
            '/app/backend/app/main.py',
            '/app/setup.sh',
            '/app/scripts/health-check.sh',
            '/app/Makefile',
            '/app/README.md'
        ]
        
        missing_files = []
        for file_path in required_files:
            if not os.path.exists(file_path):
                missing_files.append(file_path)
        
        if missing_files:
            self.issues.extend([f"Missing file: {f}" for f in missing_files])
            return False
        return True
    
    def test_dockerfile_structure(self):
        """Test backend Dockerfile structure"""
        try:
            with open('/app/backend/Dockerfile', 'r') as f:
                dockerfile_content = f.read()
            
            required_instructions = ['FROM', 'WORKDIR', 'COPY', 'RUN', 'EXPOSE', 'CMD']
            missing_instructions = []
            
            for instruction in required_instructions:
                if instruction not in dockerfile_content:
                    missing_instructions.append(instruction)
            
            if missing_instructions:
                self.issues.append(f"Dockerfile missing instructions: {missing_instructions}")
                return False
            return True
        except Exception as e:
            self.issues.append(f"Dockerfile validation failed: {e}")
            return False
    
    def test_requirements_txt(self):
        """Test requirements.txt has essential dependencies"""
        try:
            with open('/app/backend/requirements.txt', 'r') as f:
                requirements = f.read()
            
            essential_deps = ['fastapi', 'uvicorn', 'sqlalchemy', 'asyncpg', 'redis', 'httpx', 'pydantic']
            missing_deps = []
            
            for dep in essential_deps:
                if dep not in requirements.lower():
                    missing_deps.append(dep)
            
            if missing_deps:
                self.issues.append(f"Missing essential dependencies: {missing_deps}")
                return False
            return True
        except Exception as e:
            self.issues.append(f"Requirements.txt validation failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all infrastructure tests"""
        print("=== Nameh.me Infrastructure Test Suite ===\n")
        
        # File existence tests
        self.run_test("Required Files Exist", self.test_required_files_exist)
        
        # Syntax validation tests
        self.run_test("Docker Compose YAML Syntax", self.test_docker_compose_syntax)
        self.run_test("Stalwart TOML Syntax", self.test_stalwart_config_syntax)
        self.run_test("Traefik YAML Syntax", self.test_traefik_config_syntax)
        
        # Python code tests
        self.run_test("Backend Python Imports", self.test_backend_python_imports)
        self.run_test("Dockerfile Structure", self.test_dockerfile_structure)
        self.run_test("Requirements.txt Dependencies", self.test_requirements_txt)
        
        # Configuration consistency tests
        self.run_test("Environment Variable Consistency", self.test_environment_consistency)
        self.run_test("Service Dependencies", self.test_service_dependencies)
        
        # Print results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.issues:
            print(f"\n❌ Issues Found:")
            for issue in self.issues:
                print(f"  - {issue}")
            return False
        else:
            print(f"\n✅ All infrastructure tests passed!")
            return True

def main():
    tester = NamehInfrastructureTest()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())