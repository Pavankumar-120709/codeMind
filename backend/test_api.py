import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from starlette.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)

    # 1. Health
    r = client.get('/api/health')
    assert r.status_code == 200, f'Health failed: {r.text}'
    print('✓ Health check passed:', r.json())

    # 2. List repos (auto-initializes demo repository)
    r = client.get('/api/repositories')
    assert r.status_code == 200, f'Repos failed: {r.text}'
    repos = r.json()
    assert len(repos) > 0, 'No repos returned'
    repo_id = repos[0]['id']
    repo_name = repos[0]['name']
    print(f'✓ List repos passed: Found {len(repos)} repo(s). First repo: {repo_name} ({repo_id})')

    # 3. Get single repo
    r = client.get(f'/api/repositories/{repo_id}')
    assert r.status_code == 200
    print('✓ Get repo passed')

    # 4. Tree
    r = client.get(f'/api/repositories/{repo_id}/tree')
    assert r.status_code == 200
    tree = r.json()
    print(f'✓ Tree passed: {len(tree)} top-level items')

    # 5. File content
    r = client.get(f'/api/repositories/{repo_id}/files?path=src/auth/jwt.py')
    assert r.status_code == 200
    file_info = r.json()
    print(f'✓ File content passed: {file_info["name"]}, {file_info["lines"]} lines')

    # 6. Stats
    r = client.get(f'/api/repositories/{repo_id}/stats')
    assert r.status_code == 200
    print('✓ Stats passed:', r.json())

    # 7. Conversations
    r = client.get(f'/api/repositories/{repo_id}/conversations')
    assert r.status_code == 200
    print(f'✓ Conversations passed: {len(r.json())} conversation(s)')

    # 8. Chat
    r = client.post(f'/api/repositories/{repo_id}/chat?stream=false', json={'message': 'How does JWT authentication work?'})
    assert r.status_code == 200
    chat_res = r.json()
    print('✓ Chat passed: Response received, conversation_id =', chat_res.get('conversation_id'))

    # 9. Architecture
    r = client.get(f'/api/repositories/{repo_id}/architecture')
    assert r.status_code == 200
    print('✓ Architecture passed: Overview present')

    # 10. Bug Analysis
    r = client.post(f'/api/repositories/{repo_id}/analyze', json={'file_path': 'src/services/payment.py'})
    assert r.status_code == 200
    print('✓ Bug analysis passed: Findings returned =', len(r.json().get('findings', [])))

    # 11. Test Generation
    r = client.post(f'/api/repositories/{repo_id}/generate-tests', json={'file_path': 'src/services/payment.py'})
    assert r.status_code == 200
    print('✓ Test generation passed: Framework =', r.json().get('framework'))

    print('\n======================================================')
    print(' ALL 11 BACKEND API ENDPOINTS VERIFIED SUCCESSFULLY! ')
    print('======================================================')

if __name__ == '__main__':
    run_tests()
