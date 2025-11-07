const express = require('express');
const router = express.Router();
const TravelSite = require('../models/TravelSite');

// 전체 사이트 조회 (카테고리별 필터 가능)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    const sites = await TravelSite.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 사이트 조회
router.get('/:id', async (req, res) => {
  try {
    const site = await TravelSite.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: '사이트를 찾을 수 없습니다' });
    }
    res.json(site);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 사이트 추가 (관리자)
router.post('/', async (req, res) => {
  const site = new TravelSite(req.body);
  
  try {
    const newSite = await site.save();
    res.status(201).json(newSite);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 사이트 수정 (관리자)
router.put('/:id', async (req, res) => {
  try {
    const site = await TravelSite.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: '사이트를 찾을 수 없습니다' });
    }
    
    Object.assign(site, req.body);
    const updatedSite = await site.save();
    res.json(updatedSite);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 사이트 삭제 (관리자)
router.delete('/:id', async (req, res) => {
  try {
    const site = await TravelSite.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: '사이트를 찾을 수 없습니다' });
    }
    
    await site.deleteOne();
    res.json({ message: '사이트가 삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 카테고리 목록 조회
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await TravelSite.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;