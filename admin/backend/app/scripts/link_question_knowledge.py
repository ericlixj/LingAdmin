"""
题目与知识点关联脚本

根据题目内容（stem）与知识点（title/description）进行关键词匹配，
自动建立 StudyQuestionKnowledge 关联记录。

使用方法:
    cd admin/backend
    uv run python -m app.scripts.link_question_knowledge --exam-id 1
    
    # 查看摘要
    uv run python -m app.scripts.link_question_knowledge --summary
    
    # 试运行（不写入数据库）
    uv run python -m app.scripts.link_question_knowledge --exam-id 1 --dry-run
"""
import argparse
import re
import sys
from collections import defaultdict
from typing import List, Dict, Set, Tuple
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 配置
CREATOR = "system"

# 停用词列表（常见词汇，不应作为匹配关键词）
STOP_WORDS = {
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
    'because', 'until', 'while', 'of', 'at', 'by', 'about', 'against',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'your', 'you', 'we', 'us', 'our',
    'i', 'me', 'my', 'he', 'him', 'his', 'she', 'her', 'hers',
}

# 驾驶相关的重要关键词（赋予更高权重）
IMPORTANT_KEYWORDS = {
    'speed', 'brake', 'braking', 'stop', 'stopping', 'distance',
    'following', 'lane', 'turn', 'signal', 'mirror', 'blind spot',
    'pedestrian', 'intersection', 'traffic', 'light', 'sign',
    'highway', 'freeway', 'merge', 'exit', 'ramp',
    'tire', 'wheel', 'steering', 'acceleration', 'deceleration',
    'air brake', 'hydraulic', 'emergency', 'hazard', 'warning',
    'weight', 'load', 'cargo', 'trailer', 'coupling', 'uncoupling',
    'pre-trip', 'inspection', 'safety', 'regulation', 'law',
    'passenger', 'bus', 'taxi', 'commercial', 'class',
    'hours of service', 'fatigue', 'rest', 'driving time',
    'night', 'weather', 'rain', 'snow', 'fog', 'ice',
    'hill', 'grade', 'mountain', 'curve', 'corner',
}


def extract_keywords(text: str) -> Set[str]:
    """从文本中提取关键词"""
    if not text:
        return set()
    
    # 转小写并提取单词
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    
    # 过滤停用词
    keywords = {w for w in words if w not in STOP_WORDS}
    
    # 提取重要短语（2-3个词的组合）
    text_lower = text.lower()
    for phrase in IMPORTANT_KEYWORDS:
        if phrase in text_lower:
            keywords.add(phrase.replace(' ', '_'))  # 用下划线连接短语
    
    return keywords


def calculate_similarity(question_keywords: Set[str], knowledge_keywords: Set[str]) -> float:
    """计算关键词相似度"""
    if not question_keywords or not knowledge_keywords:
        return 0.0
    
    # 计算交集
    common = question_keywords & knowledge_keywords
    if not common:
        return 0.0
    
    # 基础分数：Jaccard 相似度
    union = question_keywords | knowledge_keywords
    base_score = len(common) / len(union)
    
    # 重要关键词加权
    important_common = sum(1 for k in common if k in IMPORTANT_KEYWORDS or k.replace('_', ' ') in IMPORTANT_KEYWORDS)
    bonus = important_common * 0.1
    
    return min(base_score + bonus, 1.0)


def find_matching_knowledge(
    question: dict,
    knowledge_nodes: List[dict],
    threshold: float = 0.15
) -> List[Tuple[int, float]]:
    """
    为题目找到匹配的知识点
    
    返回: [(knowledge_node_id, similarity_score), ...]
    """
    # 提取题目关键词（从 stem 和 options）
    question_text = question.get('stem', '')
    
    # 尝试解析 options JSON
    options_text = ''
    try:
        import json
        options = json.loads(question.get('options', '[]'))
        if isinstance(options, list):
            for opt in options:
                if isinstance(opt, str):
                    options_text += ' ' + opt
                elif isinstance(opt, dict):
                    options_text += ' ' + opt.get('value', '') + ' ' + opt.get('text', '')
    except:
        pass
    
    question_keywords = extract_keywords(question_text + ' ' + options_text)
    
    matches = []
    for kn in knowledge_nodes:
        # 提取知识点关键词（从 title 和 description）
        kn_text = kn.get('title', '') + ' ' + kn.get('description', '')
        kn_keywords = extract_keywords(kn_text)
        
        # 计算相似度
        similarity = calculate_similarity(question_keywords, kn_keywords)
        
        if similarity >= threshold:
            matches.append((kn['id'], similarity))
    
    # 按相似度排序
    matches.sort(key=lambda x: x[1], reverse=True)
    
    # 返回前 5 个最匹配的
    return matches[:5]


def link_questions_to_knowledge(exam_id: int, dry_run: bool = False, threshold: float = 0.15):
    """批量关联题目与知识点"""
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models.studyQuestion import StudyQuestion
    from app.models.studyKnowledgeNode import StudyKnowledgeNode
    from app.models.studyQuestionKnowledge import StudyQuestionKnowledge
    
    with Session(engine) as session:
        # 获取所有题目
        questions = session.exec(
            select(StudyQuestion).where(
                StudyQuestion.exam_id == exam_id,
                StudyQuestion.deleted == False
            )
        ).all()
        logger.info(f"找到 {len(questions)} 道题目 (exam_id={exam_id})")
        
        # 获取所有知识点
        knowledge_nodes = session.exec(
            select(StudyKnowledgeNode).where(
                StudyKnowledgeNode.exam_id == exam_id,
                StudyKnowledgeNode.deleted == False
            )
        ).all()
        logger.info(f"找到 {len(knowledge_nodes)} 个知识点 (exam_id={exam_id})")
        
        if not questions:
            logger.warning("没有找到题目")
            return
        
        if not knowledge_nodes:
            logger.warning("没有找到知识点")
            return
        
        # 转换为字典列表
        questions_data = [
            {'id': q.id, 'stem': q.stem, 'options': q.options}
            for q in questions
        ]
        knowledge_data = [
            {'id': kn.id, 'title': kn.title, 'description': kn.description, 'code': kn.code}
            for kn in knowledge_nodes
        ]
        
        # 获取现有关联
        existing_links = session.exec(
            select(StudyQuestionKnowledge).where(
                StudyQuestionKnowledge.deleted == False
            )
        ).all()
        existing_set = {(link.question_id, link.knowledge_node_id) for link in existing_links}
        logger.info(f"现有关联数: {len(existing_set)}")
        
        # 统计
        stats = {
            'questions_processed': 0,
            'new_links': 0,
            'skipped_existing': 0,
            'no_match': 0,
        }
        
        # 匹配详情
        match_details = []
        
        for q in questions_data:
            matches = find_matching_knowledge(q, knowledge_data, threshold)
            stats['questions_processed'] += 1
            
            if not matches:
                stats['no_match'] += 1
                match_details.append({
                    'question_id': q['id'],
                    'stem_preview': q['stem'][:80] + '...' if len(q['stem']) > 80 else q['stem'],
                    'matches': []
                })
                continue
            
            question_matches = []
            for kn_id, score in matches:
                if (q['id'], kn_id) in existing_set:
                    stats['skipped_existing'] += 1
                    continue
                
                # 找到知识点信息
                kn_info = next((k for k in knowledge_data if k['id'] == kn_id), {})
                question_matches.append({
                    'knowledge_id': kn_id,
                    'knowledge_code': kn_info.get('code', ''),
                    'knowledge_title': kn_info.get('title', '')[:50],
                    'score': round(score, 3)
                })
                
                if not dry_run:
                    # 创建关联记录
                    weight = int(score * 100)  # 转换为 0-100 的权重
                    link = StudyQuestionKnowledge(
                        question_id=q['id'],
                        knowledge_node_id=kn_id,
                        weight=weight,
                        creator=CREATOR,
                        deleted=False
                    )
                    session.add(link)
                    existing_set.add((q['id'], kn_id))
                
                stats['new_links'] += 1
            
            match_details.append({
                'question_id': q['id'],
                'stem_preview': q['stem'][:80] + '...' if len(q['stem']) > 80 else q['stem'],
                'matches': question_matches
            })
            
            if stats['questions_processed'] % 20 == 0:
                logger.info(f"已处理 {stats['questions_processed']} 道题目...")
        
        if not dry_run:
            session.commit()
            logger.info("关联数据已保存到数据库")
        
        # 打印结果
        print("\n" + "=" * 70)
        print("关联结果摘要" + (" [试运行模式]" if dry_run else ""))
        print("=" * 70)
        print(f"处理题目数: {stats['questions_processed']}")
        print(f"新建关联数: {stats['new_links']}")
        print(f"跳过已存在: {stats['skipped_existing']}")
        print(f"无匹配题目: {stats['no_match']}")
        print("=" * 70)
        
        # 打印匹配详情（前10个）
        print("\n匹配详情示例 (前10个):")
        print("-" * 70)
        for detail in match_details[:10]:
            print(f"\n题目 #{detail['question_id']}: {detail['stem_preview']}")
            if detail['matches']:
                for m in detail['matches']:
                    print(f"  → [{m['knowledge_code']}] {m['knowledge_title']} (score: {m['score']})")
            else:
                print("  → 无匹配")
        
        return stats


def show_summary(exam_id: int = None):
    """显示关联数据摘要"""
    from sqlmodel import Session, select, func
    from app.core.db import engine
    from app.models.studyQuestion import StudyQuestion
    from app.models.studyKnowledgeNode import StudyKnowledgeNode
    from app.models.studyQuestionKnowledge import StudyQuestionKnowledge
    
    with Session(engine) as session:
        # 题目统计
        q_query = select(func.count()).select_from(StudyQuestion).where(
            StudyQuestion.deleted == False
        )
        if exam_id:
            q_query = q_query.where(StudyQuestion.exam_id == exam_id)
        question_count = session.exec(q_query).one()
        
        # 知识点统计
        kn_query = select(func.count()).select_from(StudyKnowledgeNode).where(
            StudyKnowledgeNode.deleted == False
        )
        if exam_id:
            kn_query = kn_query.where(StudyKnowledgeNode.exam_id == exam_id)
        knowledge_count = session.exec(kn_query).one()
        
        # 关联统计
        link_count = session.exec(
            select(func.count()).select_from(StudyQuestionKnowledge).where(
                StudyQuestionKnowledge.deleted == False
            )
        ).one()
        
        # 已关联题目数
        linked_questions = session.exec(
            select(func.count(func.distinct(StudyQuestionKnowledge.question_id))).where(
                StudyQuestionKnowledge.deleted == False
            )
        ).one()
        
        # 已关联知识点数
        linked_knowledge = session.exec(
            select(func.count(func.distinct(StudyQuestionKnowledge.knowledge_node_id))).where(
                StudyQuestionKnowledge.deleted == False
            )
        ).one()
        
        print("\n" + "=" * 60)
        print("数据摘要" + (f" (exam_id={exam_id})" if exam_id else ""))
        print("=" * 60)
        print(f"题目总数 (StudyQuestion): {question_count}")
        print(f"知识点总数 (StudyKnowledgeNode): {knowledge_count}")
        print(f"关联记录数 (StudyQuestionKnowledge): {link_count}")
        print(f"已关联题目数: {linked_questions} ({linked_questions/question_count*100:.1f}%)" if question_count > 0 else "已关联题目数: 0")
        print(f"已关联知识点数: {linked_knowledge} ({linked_knowledge/knowledge_count*100:.1f}%)" if knowledge_count > 0 else "已关联知识点数: 0")
        print("=" * 60)


def clear_links(exam_id: int = None):
    """清除关联数据"""
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models.studyQuestion import StudyQuestion
    from app.models.studyQuestionKnowledge import StudyQuestionKnowledge
    
    with Session(engine) as session:
        query = select(StudyQuestionKnowledge).where(StudyQuestionKnowledge.deleted == False)
        
        if exam_id:
            # 只删除特定 exam 的关联
            question_ids = session.exec(
                select(StudyQuestion.id).where(StudyQuestion.exam_id == exam_id)
            ).all()
            query = query.where(StudyQuestionKnowledge.question_id.in_(question_ids))
        
        links = session.exec(query).all()
        
        if not links:
            logger.info("没有找到需要删除的关联记录")
            return
        
        response = input(f"确定要删除 {len(links)} 条关联记录吗? (y/n): ")
        if response.lower() != 'y':
            logger.info("取消删除")
            return
        
        for link in links:
            session.delete(link)
        
        session.commit()
        logger.info(f"已删除 {len(links)} 条关联记录")


def main():
    parser = argparse.ArgumentParser(description="题目与知识点关联脚本")
    parser.add_argument("--exam-id", type=int, help="考试 ID")
    parser.add_argument("--threshold", type=float, default=0.15, help="匹配阈值 (0-1, 默认 0.15)")
    parser.add_argument("--dry-run", action="store_true", help="试运行（不写入数据库）")
    parser.add_argument("--summary", action="store_true", help="显示数据摘要")
    parser.add_argument("--clear", action="store_true", help="清除关联数据")
    
    args = parser.parse_args()
    
    if args.summary:
        show_summary(args.exam_id)
        return
    
    if args.clear:
        clear_links(args.exam_id)
        show_summary(args.exam_id)
        return
    
    if not args.exam_id:
        logger.error("请指定 --exam-id 参数")
        sys.exit(1)
    
    link_questions_to_knowledge(args.exam_id, args.dry_run, args.threshold)
    
    if not args.dry_run:
        show_summary(args.exam_id)


if __name__ == "__main__":
    main()
