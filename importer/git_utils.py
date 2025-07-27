"""
Git 자동화 유틸리티
웹훅으로 생성된 포스트를 자동으로 커밋하고 푸시합니다.
"""

import subprocess
import logging
from pathlib import Path
from typing import Optional, List

logger = logging.getLogger(__name__)

class GitAutoCommit:
    """Git 자동 커밋/푸시 클래스"""
    
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        
    def run_git_command(self, command: List[str]) -> tuple[bool, str]:
        """Git 명령어 실행"""
        try:
            result = subprocess.run(
                ["git"] + command,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                logger.debug(f"Git 명령어 성공: {' '.join(command)}")
                return True, result.stdout.strip()
            else:
                logger.error(f"Git 명령어 실패: {' '.join(command)}, 에러: {result.stderr}")
                return False, result.stderr.strip()
                
        except Exception as e:
            logger.error(f"Git 명령어 실행 중 예외 발생: {e}")
            return False, str(e)
    
    def check_git_status(self) -> tuple[bool, str]:
        """Git 상태 확인"""
        return self.run_git_command(["status", "--porcelain"])
    
    def add_files(self, files: Optional[List[str]] = None) -> bool:
        """파일들을 staging area에 추가"""
        if files is None:
            # 모든 변경사항 추가
            success, output = self.run_git_command(["add", "."])
        else:
            # 특정 파일들만 추가
            success, output = self.run_git_command(["add"] + files)
        
        return success
    
    def create_commit(self, message: str, author_name: Optional[str] = None, 
                     author_email: Optional[str] = None) -> bool:
        """커밋 생성"""
        commit_args = ["commit", "-m", message]
        
        # 작성자 정보가 제공된 경우
        if author_name and author_email:
            commit_args.extend(["--author", f"{author_name} <{author_email}>"])
        
        success, output = self.run_git_command(commit_args)
        return success
    
    def push_to_remote(self, remote: str = "origin", branch: str = "main") -> bool:
        """원격 저장소에 푸시"""
        success, output = self.run_git_command(["push", remote, branch])
        return success
    
    def get_current_branch(self) -> Optional[str]:
        """현재 브랜치 이름 가져오기"""
        success, branch = self.run_git_command(["rev-parse", "--abbrev-ref", "HEAD"])
        return branch if success else None
    
    def auto_commit_and_push(self, post_title: str, post_path: str, 
                           author_name: Optional[str] = None,
                           author_email: Optional[str] = None) -> bool:
        """자동 커밋 및 푸시"""
        try:
            # Git 상태 확인
            has_changes, status_output = self.check_git_status()
            if not status_output:
                logger.info("커밋할 변경사항이 없습니다.")
                return True
            
            logger.info(f"Git 상태: {status_output}")
            
            # 파일 추가
            if not self.add_files():
                logger.error("파일 추가 실패")
                return False
            
            # 커밋 메시지 생성
            commit_message = f"Add new post: {post_title}\n\nAuto-generated from n8n webhook\nPath: {post_path}"
            
            # 커밋 생성
            if not self.create_commit(commit_message, author_name, author_email):
                logger.error("커밋 생성 실패")
                return False
            
            logger.info(f"커밋 생성 완료: {commit_message}")
            
            # 현재 브랜치 확인
            current_branch = self.get_current_branch()
            if not current_branch:
                logger.error("현재 브랜치를 확인할 수 없습니다.")
                return False
            
            # 원격 저장소에 푸시
            if not self.push_to_remote("origin", current_branch):
                logger.error("푸시 실패")
                return False
            
            logger.info(f"푸시 완료: origin/{current_branch}")
            return True
            
        except Exception as e:
            logger.error(f"자동 커밋/푸시 중 오류 발생: {e}", exc_info=True)
            return False
    
    def setup_git_config(self, name: str, email: str) -> bool:
        """Git 설정 (이름, 이메일)"""
        try:
            success1, _ = self.run_git_command(["config", "user.name", name])
            success2, _ = self.run_git_command(["config", "user.email", email])
            
            if success1 and success2:
                logger.info(f"Git 설정 완료: {name} <{email}>")
                return True
            else:
                logger.error("Git 설정 실패")
                return False
                
        except Exception as e:
            logger.error(f"Git 설정 중 오류 발생: {e}")
            return False